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
