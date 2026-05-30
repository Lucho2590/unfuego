// NOTA: módulo server-only — lee process.env con secretos y desencripta credenciales. No
// importar desde componentes cliente.
import { fsGet, fsSet } from "../firebase/admin";
import { encryptSecret, decryptSecret } from "../crypto/secrets";
import type {
  MercadoPagoMode,
  MercadoPagoSettings,
  MercadoPagoSettingsUI,
  CredsSource,
  EncryptedModeCreds,
} from "../types";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC = "mercadopago";

interface ModeCredentials {
  accessToken: string;
  webhookSecret: string;
}

/**
 * Lee las credenciales de un modo desde las env vars (fallback).
 * Devuelve null si falta alguna de las dos.
 */
function credsFromEnv(mode: MercadoPagoMode): ModeCredentials | null {
  const prefix = mode === "production" ? "MP_PROD" : "MP_TEST";
  const accessToken = process.env[`${prefix}_ACCESS_TOKEN`]?.trim() ?? "";
  const webhookSecret = process.env[`${prefix}_WEBHOOK_SECRET`]?.trim() ?? "";

  // Fallback temporal durante el cutover: el modo test puede usar el token legacy.
  if (mode === "test" && !accessToken) {
    const legacy = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? "";
    if (legacy) {
      return { accessToken: legacy, webhookSecret };
    }
  }

  if (!accessToken || !webhookSecret) return null;
  return { accessToken, webhookSecret };
}

/**
 * Lee las credenciales de un modo desde la DB (encriptadas). Requiere ambos campos.
 * Si la desencriptación falla (clave incorrecta / dato corrupto), loguea y devuelve null
 * para caer al fallback de env (no romper checkout/webhook por un dato corrupto).
 */
async function credsFromDb(
  mode: MercadoPagoMode,
  doc: MercadoPagoSettings | null
): Promise<ModeCredentials | null> {
  const enc = doc?.[mode];
  if (!enc?.accessTokenEnc || !enc?.webhookSecretEnc) return null;
  try {
    const [accessToken, webhookSecret] = await Promise.all([
      decryptSecret(enc.accessTokenEnc),
      decryptSecret(enc.webhookSecretEnc),
    ]);
    if (!accessToken || !webhookSecret) return null;
    return { accessToken, webhookSecret };
  } catch (error) {
    console.error(`Error desencriptando credenciales MP (${mode}):`, error);
    return null;
  }
}

/**
 * Resuelve las credenciales de un modo con precedencia DB > env (por modo completo, sin
 * mezclar fuentes). Recibe el doc ya leído para evitar múltiples lecturas.
 */
async function resolveCreds(
  mode: MercadoPagoMode,
  doc: MercadoPagoSettings | null
): Promise<{ creds: ModeCredentials | null; source: CredsSource }> {
  const fromDb = await credsFromDb(mode, doc);
  if (fromDb) return { creds: fromDb, source: "db" };

  const fromEnv = credsFromEnv(mode);
  if (fromEnv) return { creds: fromEnv, source: "env" };

  return { creds: null, source: null };
}

async function getDoc(): Promise<MercadoPagoSettings | null> {
  return (await fsGet(SETTINGS_COLLECTION, SETTINGS_DOC)) as
    | (MercadoPagoSettings & { id: string })
    | null;
}

/** Lee el modo activo desde DB (default "test"). */
export async function getActiveMode(): Promise<MercadoPagoMode> {
  const doc = await getDoc();
  return doc?.activeMode === "production" ? "production" : "test";
}

/** MercadoPago está habilitado salvo que explícitamente se haya puesto enabled=false. */
function isEnabled(doc: MercadoPagoSettings | null): boolean {
  return doc?.enabled !== false;
}

/** Para guards server-side rápidos (no desencripta). */
export async function isMercadoPagoEnabled(): Promise<boolean> {
  return isEnabled(await getDoc());
}

/**
 * Settings públicas (no secretas) para el checkout: si MP está habilitado y si está realmente
 * disponible (habilitado + con credenciales del modo activo).
 */
export async function getPublicMercadoPagoSettings(): Promise<{
  enabled: boolean;
  available: boolean;
}> {
  const doc = await getDoc();
  const enabled = isEnabled(doc);
  const mode = doc?.activeMode === "production" ? "production" : "test";
  const { creds } = await resolveCreds(mode, doc);
  return { enabled, available: enabled && !!creds };
}

/**
 * Para checkout y webhook: credenciales del modo activo SIN enmascarar (solo server-side).
 * null si el modo activo no tiene ambas credenciales (ni en DB ni en env).
 */
export async function getActiveMercadoPago(): Promise<
  ({ mode: MercadoPagoMode } & ModeCredentials) | null
> {
  const doc = await getDoc();
  const mode = doc?.activeMode === "production" ? "production" : "test";
  const { creds } = await resolveCreds(mode, doc);
  if (!creds) return null;
  return { mode, ...creds };
}

/**
 * Para el webhook: ambos secretos (test y production) para poder verificar la firma
 * contra los dos (cubre el caso de un webhook que llega justo después de cambiar de modo).
 */
export async function getMercadoPagoSecrets(): Promise<{
  activeMode: MercadoPagoMode;
  test: ModeCredentials | null;
  production: ModeCredentials | null;
}> {
  const doc = await getDoc();
  const activeMode = doc?.activeMode === "production" ? "production" : "test";
  const [test, production] = await Promise.all([
    resolveCreds("test", doc),
    resolveCreds("production", doc),
  ]);
  return { activeMode, test: test.creds, production: production.creds };
}

/** Enmascara un secreto mostrando los primeros 6 y últimos 4 caracteres. */
export function maskSecret(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.length <= 12) return "••••";
  return `${value.slice(0, 6)}••••${value.slice(-4)}`;
}

/** Settings enmascaradas para la UI de admin. Nunca expone el token completo. */
export async function getSettingsForUI(): Promise<MercadoPagoSettingsUI> {
  const doc = await getDoc();
  const [test, production] = await Promise.all([
    resolveCreds("test", doc),
    resolveCreds("production", doc),
  ]);

  return {
    activeMode: doc?.activeMode === "production" ? "production" : "test",
    enabled: isEnabled(doc),
    test: {
      configured: !!test.creds,
      tokenMasked: maskSecret(test.creds?.accessToken),
      source: test.source,
      hasWebhookSecret: !!test.creds?.webhookSecret,
    },
    production: {
      configured: !!production.creds,
      tokenMasked: maskSecret(production.creds?.accessToken),
      source: production.source,
      hasWebhookSecret: !!production.creds?.webhookSecret,
    },
    updatedAt: doc?.updatedAt,
    updatedBy: doc?.updatedBy,
  };
}

/**
 * Cambia el modo activo. Valida que el modo destino tenga ambas credenciales (DB o env)
 * ANTES de activarlo. Usa merge para no pisar las credenciales encriptadas del doc.
 */
export async function setActiveMode(
  mode: MercadoPagoMode,
  updatedBy: string
): Promise<void> {
  if (mode !== "test" && mode !== "production") {
    throw new Error("Modo inválido");
  }
  const doc = await getDoc();
  const { creds } = await resolveCreds(mode, doc);
  if (!creds) {
    throw new Error(
      `El modo "${mode}" no tiene credenciales configuradas (ni en la app ni en env vars).`
    );
  }
  await fsSet(
    SETTINGS_COLLECTION,
    SETTINGS_DOC,
    { activeMode: mode, updatedBy },
    { merge: true, timestamps: true }
  );
}

/** Habilita o deshabilita MercadoPago como método de pago en el checkout. */
export async function setEnabled(enabled: boolean, updatedBy: string): Promise<void> {
  await fsSet(
    SETTINGS_COLLECTION,
    SETTINGS_DOC,
    { enabled, updatedBy },
    { merge: true, timestamps: true }
  );
}

/**
 * Guarda/actualiza las credenciales de un modo, encriptadas. Solo encripta los campos que
 * vengan no vacíos (permite actualizar uno solo). Lanza si ambos vienen vacíos o si falta
 * MP_ENCRYPTION_KEY. Usa merge para preservar el otro modo y el resto del doc.
 */
export async function saveMercadoPagoCredentials(
  mode: MercadoPagoMode,
  input: { accessToken?: string; webhookSecret?: string },
  updatedBy: string
): Promise<void> {
  if (mode !== "test" && mode !== "production") {
    throw new Error("Modo inválido");
  }

  const accessToken = input.accessToken?.trim() ?? "";
  const webhookSecret = input.webhookSecret?.trim() ?? "";
  if (!accessToken && !webhookSecret) {
    throw new Error("No hay credenciales para guardar.");
  }

  const enc: EncryptedModeCreds = {};
  if (accessToken) enc.accessTokenEnc = await encryptSecret(accessToken);
  if (webhookSecret) enc.webhookSecretEnc = await encryptSecret(webhookSecret);

  await fsSet(
    SETTINGS_COLLECTION,
    SETTINGS_DOC,
    { [mode]: enc, updatedBy },
    { merge: true, timestamps: true }
  );
}
