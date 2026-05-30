// NOTA: módulo server-only — usa credenciales de MercadoPago. No importar desde cliente.
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getActiveMercadoPago } from "./settings";
import type { MercadoPagoMode } from "../types";

// El SDK no re-exporta PreferenceRequest desde el index; lo derivamos del método create.
type PreferenceBody = Parameters<InstanceType<typeof Preference>["create"]>[0]["body"];

export interface MercadoPagoContext {
  config: MercadoPagoConfig;
  mode: MercadoPagoMode;
}

/**
 * Construye el contexto de MercadoPago (config del SDK + modo activo) a partir de las
 * credenciales del modo activo. Devuelve null si no hay credenciales configuradas.
 */
export async function getMercadoPagoContext(): Promise<MercadoPagoContext | null> {
  const active = await getActiveMercadoPago();
  if (!active) return null;
  return {
    config: new MercadoPagoConfig({ accessToken: active.accessToken }),
    mode: active.mode,
  };
}

/** Trae un pago por id desde la API de MercadoPago. */
export async function getPayment(ctx: MercadoPagoContext, paymentId: string | number) {
  const payment = new Payment(ctx.config);
  return payment.get({ id: String(paymentId) });
}

/**
 * Busca pagos por external_reference (= orderId). Usado por el polling de respaldo
 * de la página de confirmación, por si el webhook se demora.
 */
export async function searchPaymentsByExternalReference(
  ctx: MercadoPagoContext,
  externalReference: string
) {
  const payment = new Payment(ctx.config);
  const res = await payment.search({
    options: {
      external_reference: externalReference,
      sort: "date_created",
      criteria: "desc",
    },
  });
  return res.results ?? [];
}

/** Crea una preference. Devuelve `{ mode, result }` para elegir el init_point correcto. */
export async function createPreference(
  ctx: MercadoPagoContext,
  body: PreferenceBody
) {
  const preference = new Preference(ctx.config);
  const result = await preference.create({ body });
  return { mode: ctx.mode, result };
}

/**
 * Elige la URL de checkout según el modo: en test preferimos sandbox_init_point.
 */
export function pickInitPoint(
  mode: MercadoPagoMode,
  result: { init_point?: string; sandbox_init_point?: string }
): string | undefined {
  if (mode === "test") return result.sandbox_init_point || result.init_point;
  return result.init_point;
}

/**
 * true solo si la URL es https pública (no localhost / .local / IPs privadas).
 * MercadoPago rechaza `auto_return` y notification_url con localhost.
 */
export function isPublicHttps(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname;
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.16.")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
