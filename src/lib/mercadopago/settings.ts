// NOTA: módulo server-only — lee process.env con secretos. No importar desde componentes cliente.
import { fsGet, fsSet } from "../firebase/admin";
import type {
  MercadoPagoMode,
  MercadoPagoSettings,
  MercadoPagoSettingsUI,
} from "../types";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC = "mercadopago";

interface ModeCredentials {
  accessToken: string;
  webhookSecret: string;
}

/**
 * Lee las credenciales de un modo desde las env vars (NUNCA desde la DB).
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

/** Lee el modo activo desde DB (default "test"). */
export async function getActiveMode(): Promise<MercadoPagoMode> {
  const doc = (await fsGet(SETTINGS_COLLECTION, SETTINGS_DOC)) as
    | (MercadoPagoSettings & { id: string })
    | null;
  return doc?.activeMode === "production" ? "production" : "test";
}

/**
 * Para checkout y webhook: credenciales del modo activo SIN enmascarar (solo server-side).
 * null si el modo activo no tiene ambas credenciales configuradas.
 */
export async function getActiveMercadoPago(): Promise<
  { mode: MercadoPagoMode } & ModeCredentials | null
> {
  const mode = await getActiveMode();
  const creds = credsFromEnv(mode);
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
  const activeMode = await getActiveMode();
  return {
    activeMode,
    test: credsFromEnv("test"),
    production: credsFromEnv("production"),
  };
}

/** Enmascara un secreto mostrando los primeros 6 y últimos 4 caracteres. */
export function maskSecret(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.length <= 12) return "••••";
  return `${value.slice(0, 6)}••••${value.slice(-4)}`;
}

/** Settings enmascaradas para la UI de admin. Nunca expone el token completo. */
export async function getSettingsForUI(): Promise<MercadoPagoSettingsUI> {
  const doc = (await fsGet(SETTINGS_COLLECTION, SETTINGS_DOC)) as
    | (MercadoPagoSettings & { id: string })
    | null;
  const test = credsFromEnv("test");
  const production = credsFromEnv("production");

  return {
    activeMode: doc?.activeMode === "production" ? "production" : "test",
    test: { configured: !!test, tokenMasked: maskSecret(test?.accessToken) },
    production: {
      configured: !!production,
      tokenMasked: maskSecret(production?.accessToken),
    },
    updatedAt: doc?.updatedAt,
    updatedBy: doc?.updatedBy,
  };
}

/**
 * Cambia el modo activo. Valida que el modo destino tenga ambas credenciales
 * (en env vars) ANTES de activarlo. Lanza si no.
 */
export async function setActiveMode(
  mode: MercadoPagoMode,
  updatedBy: string
): Promise<void> {
  if (mode !== "test" && mode !== "production") {
    throw new Error("Modo inválido");
  }
  if (!credsFromEnv(mode)) {
    throw new Error(
      `El modo "${mode}" no tiene credenciales configuradas (faltan env vars).`
    );
  }
  await fsSet(
    SETTINGS_COLLECTION,
    SETTINGS_DOC,
    { activeMode: mode, updatedBy },
    { timestamps: true }
  );
}
