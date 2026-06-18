// Encriptación de secretos (credenciales de MercadoPago) para guardarlos en Firestore.
// AES-256-GCM con Web Crypto. La clave maestra vive en `MP_ENCRYPTION_KEY` (env, nunca en DB).
// Aunque alguien leyera la DB, sin la clave los tokens son inservibles. Módulo server-only.

const VERSION_PREFIX = "v1:";

let cachedKey: CryptoKey | null = null;

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ─── Base64url (URL-safe, sin padding) ───
// PKCE y la firma del state viajan en query params, por eso necesitan base64url (no el base64
// estándar de arriba, que usa `+`, `/` y `=`).
function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Deriva (y cachea) la CryptoKey AES-256-GCM desde `MP_ENCRYPTION_KEY` (base64 de 32 bytes). */
async function getMasterKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const raw = process.env.MP_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "MP_ENCRYPTION_KEY no está configurada (requerida para guardar credenciales encriptadas)."
    );
  }

  let keyBytes: Uint8Array<ArrayBuffer>;
  try {
    keyBytes = base64ToBytes(raw);
  } catch {
    throw new Error("MP_ENCRYPTION_KEY inválida: debe ser base64 (generar con `openssl rand -base64 32`).");
  }
  if (keyBytes.length !== 32) {
    throw new Error(
      `MP_ENCRYPTION_KEY inválida: se esperaban 32 bytes (256 bits), se obtuvieron ${keyBytes.length}.`
    );
  }

  cachedKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  return cachedKey;
}

/** Encripta texto plano → `"v1:" + base64(iv(12) || ciphertext+tag)`. */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext)
    )
  );

  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return VERSION_PREFIX + bytesToBase64(combined);
}

/** Desencripta un valor `"v1:..."`. Lanza si el formato/clave son inválidos o el dato está corrupto. */
export async function decryptSecret(stored: string): Promise<string> {
  if (!stored.startsWith(VERSION_PREFIX)) {
    throw new Error("Formato de secreto desconocido (falta prefijo de versión).");
  }
  const key = await getMasterKey();
  const combined = base64ToBytes(stored.slice(VERSION_PREFIX.length));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error("No se pudo desencriptar (clave incorrecta o dato corrupto).");
  }
}

// ─── PKCE (OAuth) ───
// Protege el intercambio del authorization code: el `codeVerifier` (secreto) se guarda en el
// server y solo su hash (`codeChallenge`) viaja en la URL de autorización. MercadoPago exige
// que el verifier coincida al canjear el code.

/** Genera un par PKCE: verifier aleatorio (43 chars base64url) y su challenge SHA-256 (S256). */
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier))
  );
  return { codeVerifier, codeChallenge: bytesToBase64Url(digest) };
}

// ─── State firmado (CSRF) ───
// El parámetro `state` del flujo OAuth se firma con HMAC-SHA256 (`AUTH_SECRET`) para que el
// callback pueda verificar que el request lo originó nuestra app y no es un replay/forgery.

const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 min: ventana de vida del state

let cachedHmacKey: CryptoKey | null = null;

async function getHmacKey(): Promise<CryptoKey> {
  if (cachedHmacKey) return cachedHmacKey;
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) {
    throw new Error("AUTH_SECRET no está configurada (requerida para firmar el state de OAuth).");
  }
  cachedHmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(raw),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return cachedHmacKey;
}

/**
 * Firma un state OAuth. Incluye un nonce y timestamp; devuelve `payloadB64url.sigB64url`.
 * El payload extra (ej. nada en single-tenant) puede pasarse como objeto serializable.
 */
export async function signState(extra: Record<string, unknown> = {}): Promise<string> {
  const key = await getHmacKey();
  const payload = {
    ...extra,
    n: bytesToBase64Url(crypto.getRandomValues(new Uint8Array(12))),
    t: Date.now(),
  };
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64))
  );
  return `${payloadB64}.${bytesToBase64Url(sig)}`;
}

/**
 * Verifica un state firmado: chequea la firma HMAC y que no esté vencido (>10 min). Devuelve el
 * payload decodificado o null si es inválido/vencido/manipulado.
 */
export async function verifyState(
  signed: string | null | undefined
): Promise<Record<string, unknown> | null> {
  if (!signed) return null;
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = signed.slice(0, dot);
  const sigB64 = signed.slice(dot + 1);

  try {
    const key = await getHmacKey();
    const sigBytes = base64UrlToBytes(sigB64);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payloadB64)
    );
    if (!ok) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadB64))
    ) as Record<string, unknown>;
    const ts = typeof payload.t === "number" ? payload.t : 0;
    if (!ts || Date.now() - ts > STATE_MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

function base64UrlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return base64ToBytes(padded);
}
