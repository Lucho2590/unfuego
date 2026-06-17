// Flujo OAuth de MercadoPago (single-tenant). El estado vive en el doc `settings/mercadopago`
// bajo el sub-objeto `oauth`. Tokens y codeVerifier se guardan encriptados. Módulo server-only:
// lee secretos de env y desencripta tokens. NO importar desde el cliente.
//
// El intercambio de código y el refresh se hacen con fetch nativo (no el SDK de MP).
import { fsGet, fsSet } from "../firebase/admin";
import {
  encryptSecret,
  decryptSecret,
  generatePKCE,
  signState,
  verifyState,
} from "../crypto/secrets";
import type {
  MercadoPagoSettings,
  MercadoPagoOAuth,
  MercadoPagoOAuthUI,
} from "../types";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC = "mercadopago";

const AUTH_BASE = "https://auth.mercadopago.com/authorization";
const TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const USERS_ME_URL = "https://api.mercadopago.com/users/me";

const REFRESH_SKEW_MS = 5 * 60 * 1000; // refresca si vence en <5 min

function getEnv() {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan MERCADOPAGO_CLIENT_ID / MERCADOPAGO_CLIENT_SECRET (requeridas para OAuth)."
    );
  }
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL no está configurada (requerida para el redirect de OAuth).");
  }
  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl.replace(/\/$/, "")}/api/integrations/mercadopago/callback`,
  };
}

async function getDoc(): Promise<(MercadoPagoSettings & { id: string }) | null> {
  return (await fsGet(SETTINGS_COLLECTION, SETTINGS_DOC)) as
    | (MercadoPagoSettings & { id: string })
    | null;
}

/** Persiste (merge) el sub-objeto `oauth` completo dentro de `settings/mercadopago`. */
async function saveOAuth(oauth: MercadoPagoOAuth, updatedBy?: string): Promise<void> {
  await fsSet(
    SETTINGS_COLLECTION,
    SETTINGS_DOC,
    { oauth, ...(updatedBy ? { updatedBy } : {}) },
    { merge: true, timestamps: true }
  );
}

/**
 * Genera la URL de autorización. Crea PKCE, firma el state, y deja el doc en status="pending"
 * guardando el codeVerifier encriptado para recuperarlo en el callback.
 */
export async function buildAuthUrl(): Promise<string> {
  const { clientId, redirectUri } = getEnv();
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = await signState();

  const doc = await getDoc();
  await saveOAuth({
    ...(doc?.oauth ?? { status: "disconnected" }),
    status: "pending",
    codeVerifierEnc: await encryptSecret(codeVerifier),
    lastError: "",
  });

  const url = new URL(AUTH_BASE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  user_id: number | string;
  public_key?: string;
  live_mode?: boolean;
}

function expiresAtISO(expiresInSec: number): string {
  // -60s de margen para no usar un token a punto de vencer.
  return new Date(Date.now() + (expiresInSec - 60) * 1000).toISOString();
}

/**
 * Canjea el authorization code por tokens y persiste status="connected". Lanza con un código de
 * razón (`invalid_state` | `missing_verifier` | `exchange_failed` | `users_me_failed`) para que
 * el callback mapee el error.
 */
export async function exchangeCode(
  code: string | null,
  state: string | null
): Promise<void> {
  const { clientId, clientSecret, redirectUri } = getEnv();

  if (!code) throw new Error("missing_code");
  if (!(await verifyState(state))) throw new Error("invalid_state");

  const doc = await getDoc();
  const verifierEnc = doc?.oauth?.codeVerifierEnc;
  if (!verifierEnc) throw new Error("missing_verifier");
  const codeVerifier = await decryptSecret(verifierEnc);

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    await markError("exchange_failed");
    throw new Error("exchange_failed");
  }
  const token = (await tokenRes.json()) as TokenResponse;

  // Info de la cuenta (email/nickname). No es crítica: si falla, conectamos igual sin esos datos.
  let email: string | undefined;
  let nickname: string | undefined;
  try {
    const meRes = await fetch(USERS_ME_URL, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as { email?: string; nickname?: string };
      email = me.email;
      nickname = me.nickname;
    }
  } catch {
    // ignorar: datos no críticos
  }

  const [accessTokenEnc, refreshTokenEnc] = await Promise.all([
    encryptSecret(token.access_token),
    encryptSecret(token.refresh_token),
  ]);

  await saveOAuth({
    status: "connected",
    accessTokenEnc,
    refreshTokenEnc,
    expiresAt: expiresAtISO(token.expires_in),
    accountId: String(token.user_id),
    publicKey: token.public_key,
    liveMode: !!token.live_mode,
    email,
    nickname,
    connectedAt: new Date().toISOString(),
    // codeVerifierEnc y lastError quedan fuera ⇒ se limpian al reemplazar el objeto oauth.
  });
}

/** Marca la conexión en error (sin tocar el resto del objeto oauth). */
async function markError(reason: string): Promise<void> {
  const doc = await getDoc();
  await saveOAuth({
    ...(doc?.oauth ?? { status: "disconnected" }),
    status: "error",
    lastError: reason,
  });
}

/** Desconecta: limpia tokens y deja status="disconnected". */
export async function disconnectOAuth(updatedBy?: string): Promise<void> {
  await saveOAuth({ status: "disconnected" }, updatedBy);
}

/**
 * Devuelve un access token OAuth válido, o null si no hay conexión activa. Refresca de forma
 * transparente si está por vencer (<5 min). Si el refresh falla, marca status="error" y devuelve
 * null para que el caller pueda caer al fallback estático sin romper el checkout.
 *
 * Acepta el doc ya leído (hot path de checkout) para evitar una segunda lectura de Firestore.
 */
export async function ensureValidToken(
  doc?: MercadoPagoSettings | null
): Promise<string | null> {
  const settings = doc !== undefined ? doc : await getDoc();
  const oauth = settings?.oauth;
  if (!oauth || oauth.status !== "connected" || !oauth.accessTokenEnc) return null;

  const notExpiring =
    oauth.expiresAt && new Date(oauth.expiresAt).getTime() - Date.now() > REFRESH_SKEW_MS;
  if (notExpiring) {
    try {
      return await decryptSecret(oauth.accessTokenEnc);
    } catch {
      return null;
    }
  }

  // Necesita refresh.
  if (!oauth.refreshTokenEnc) {
    await markError("missing_refresh_token");
    return null;
  }

  try {
    const { clientId, clientSecret } = getEnv();
    const refreshToken = await decryptSecret(oauth.refreshTokenEnc);
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) {
      await markError("refresh_failed");
      return null;
    }
    const token = (await res.json()) as TokenResponse;
    const [accessTokenEnc, refreshTokenEnc] = await Promise.all([
      encryptSecret(token.access_token),
      // MP rota el refresh token; si no viene, conservamos el anterior.
      token.refresh_token ? encryptSecret(token.refresh_token) : Promise.resolve(oauth.refreshTokenEnc),
    ]);
    await saveOAuth({
      ...oauth,
      status: "connected",
      accessTokenEnc,
      refreshTokenEnc,
      expiresAt: expiresAtISO(token.expires_in),
      liveMode: typeof token.live_mode === "boolean" ? token.live_mode : oauth.liveMode,
      lastError: "",
    });
    return token.access_token;
  } catch {
    await markError("refresh_failed");
    return null;
  }
}

/** Proyección NO secreta del estado OAuth para la UI de admin. */
export function toOAuthUI(oauth: MercadoPagoOAuth | undefined): MercadoPagoOAuthUI {
  if (!oauth) return { status: "disconnected" };
  return {
    status: oauth.status,
    email: oauth.email,
    nickname: oauth.nickname,
    liveMode: oauth.liveMode,
    connectedAt: oauth.connectedAt,
    lastError: oauth.lastError || undefined,
  };
}

/** Lee y proyecta el estado OAuth para la UI (sin exponer tokens). */
export async function getOAuthUI(): Promise<MercadoPagoOAuthUI> {
  const doc = await getDoc();
  return toOAuthUI(doc?.oauth);
}
