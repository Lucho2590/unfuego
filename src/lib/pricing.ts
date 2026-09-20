// Fuente de verdad única de la fórmula del total del carrito.
//
// Módulo PURO a propósito: no tiene imports runtime. Lo consumen el server (rutas de
// checkout, preference de MercadoPago), el cliente (CheckoutForm, CartSummary), el form
// de admin y los tests con `node --test` (type stripping nativo, que borra los
// `import type` pero resolvería un import runtime pidiendo la extensión .ts).
import type {
  DiscountType,
  PaymentAdjustment,
  PaymentAdjustmentMode,
  PaymentProvider,
} from "./types";

// OJO: el server usa SHIPPING_COST y el cliente NEXT_PUBLIC_SHIPPING_COST. Tienen que
// valer lo mismo o el checkout muestra un total distinto al que se termina cobrando.
export const PUBLIC_SHIPPING_COST = Number(process.env.NEXT_PUBLIC_SHIPPING_COST ?? 0);

export const PAYMENT_PROVIDERS: readonly PaymentProvider[] = ["mercadopago", "transfer"];

/** Nombre del medio de pago tal como se muestra al comprador. */
export function paymentProviderLabel(provider: PaymentProvider): string {
  return provider === "mercadopago" ? "MercadoPago" : "transferencia";
}

export type AdjustmentMap = Record<string, PaymentAdjustment | null | undefined>;

export interface PricingLineInput {
  productId: string;
  /** Precio unitario YA con el descuento del producto aplicado (getProductPrice().final). */
  price: number;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  quantity: number;
  /** Precio base unitario (sin el ajuste por medio de pago). */
  price: number;
  /** Precio unitario después del ajuste; nunca negativo. */
  unit: number;
  /** (unit - price) * quantity, con signo. */
  adjustment: number;
  /** unit * quantity. */
  lineTotal: number;
}

export interface PricingResult {
  lines: PricedLine[];
  /** Σ price*qty, SIN el ajuste: coincide con order.subtotal y con las filas por ítem. */
  subtotal: number;
  /** CON SIGNO: >0 recargo, <0 descuento, 0 sin ajuste. */
  adjustment: number;
  /** "" cuando adjustment === 0. Ej. "Recargo MercadoPago". */
  adjustmentLabel: string;
  shippingCost: number;
  /** subtotal + adjustment + shippingCost. Nunca menor a 0. */
  total: number;
}

export interface PricingInput {
  items: PricingLineInput[];
  method: PaymentProvider;
  /** Ajuste ya resuelto para `method`, por productId. */
  adjustments?: AdjustmentMap;
  /** Descuento global de transferencia (0-100). Solo aplica si method === "transfer". */
  transferDiscountPercent?: number;
  shippingCost: number;
}

/**
 * Aplica un ajuste a un precio unitario. Redondea a peso entero (el sitio no maneja
 * centavos) y nunca devuelve un precio negativo.
 */
export function applyPaymentAdjustment(
  unit: number,
  adj: PaymentAdjustment | null | undefined
): number {
  const base = Number.isFinite(unit) ? unit : 0;
  if (!adj || !(adj.value > 0)) return Math.max(0, Math.round(base));

  const delta =
    adj.type === "percentage"
      ? (base * Math.min(adj.value, 100)) / 100
      : adj.value;
  const signed = adj.mode === "surcharge" ? delta : -delta;

  return Math.max(0, Math.round(base + signed));
}

/**
 * Calcula el pricing del carrito para un medio de pago.
 *
 * El ajuste propio del producto PISA al descuento global de transferencia; el global
 * solo entra para los productos que no tienen ajuste definido para ese medio.
 *
 * Redondeo: por unidad y recién después × cantidad. Así `Σ unit*qty + envío === total`
 * por construcción, que es lo que hace exacta la preference de MercadoPago.
 */
export function computePricing(input: PricingInput): PricingResult {
  const { items, method, adjustments, transferDiscountPercent, shippingCost } = input;

  const globalTransfer: PaymentAdjustment | null =
    method === "transfer" && (transferDiscountPercent ?? 0) > 0
      ? {
          mode: "discount",
          type: "percentage",
          value: transferDiscountPercent as number,
          description: null,
        }
      : null;

  const lines: PricedLine[] = [];
  const descriptions = new Set<string>();

  for (const item of items) {
    const own = adjustments?.[item.productId] ?? null;
    const adj = own ?? globalTransfer;

    const unit = applyPaymentAdjustment(item.price, adj);
    const lineAdjustment = (unit - item.price) * item.quantity;

    if (lineAdjustment !== 0) {
      descriptions.add(adj?.description?.trim() || "");
    }

    lines.push({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      unit,
      adjustment: lineAdjustment,
      lineTotal: unit * item.quantity,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const adjustment = lines.reduce((sum, line) => sum + line.adjustment, 0);
  const total = Math.max(0, subtotal + adjustment + shippingCost);

  return {
    lines,
    subtotal,
    adjustment,
    adjustmentLabel: buildAdjustmentLabel(adjustment, method, descriptions),
    shippingCost,
    total,
  };
}

/**
 * Etiqueta de la fila de ajuste. Usa la descripción cargada en el admin solo si todas
 * las líneas que aportan al ajuste comparten la misma; si no, cae a una genérica según
 * el signo NETO (un carrito con recargo en un producto y descuento en otro se compensa,
 * y la etiqueta sigue al resultado neto).
 */
function buildAdjustmentLabel(
  adjustment: number,
  method: PaymentProvider,
  descriptions: Set<string>
): string {
  if (adjustment === 0) return "";

  if (descriptions.size === 1) {
    const only = [...descriptions][0];
    if (only) return only;
  }

  const kind = adjustment > 0 ? "Recargo" : "Descuento";
  return `${kind} ${paymentProviderLabel(method)}`;
}

// ─── Sanitización (entrada del admin → Firestore) ───

const MODES: readonly string[] = ["surcharge", "discount"];
const TYPES: readonly string[] = ["percentage", "fixed"];
const MAX_DESCRIPTION = 80;

function sanitizeOne(raw: unknown): PaymentAdjustment | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const mode = String(r.mode);
  const type = String(r.type);
  if (!MODES.includes(mode) || !TYPES.includes(type)) return null;

  const parsed = Number(r.value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  // Porcentaje 0-100; monto fijo en pesos enteros (el sitio no maneja centavos).
  const value =
    type === "percentage"
      ? Math.min(100, Math.round(parsed))
      : Math.max(0, Math.round(parsed));
  if (value <= 0) return null;

  const description =
    typeof r.description === "string"
      ? r.description.trim().slice(0, MAX_DESCRIPTION) || null
      : null;

  return {
    mode: mode as PaymentAdjustmentMode,
    type: type as DiscountType,
    value,
    description,
  };
}

/**
 * Normaliza el map de ajustes. SIEMPRE devuelve todas las claves (null = sin ajuste):
 * `fsUpdate` escribe con `merge: true`, que es un merge PROFUNDO, así que omitir una
 * clave dejaría vivo el ajuste anterior de ese medio en vez de borrarlo.
 */
export function sanitizePaymentAdjustments(
  raw: unknown
): Record<PaymentProvider, PaymentAdjustment | null> {
  const input = (raw ?? {}) as Record<string, unknown>;
  const out = {} as Record<PaymentProvider, PaymentAdjustment | null>;
  for (const provider of PAYMENT_PROVIDERS) {
    out[provider] = sanitizeOne(input[provider]);
  }
  return out;
}

// ─── Lectura de órdenes ya guardadas ───

interface AdjustableOrder {
  paymentAdjustment?: { amount: number; label: string } | null;
  discount?: number;
}

/**
 * Ajuste de una orden, con fallback al campo legacy `discount` (positivo = descuento)
 * para las órdenes creadas antes de `paymentAdjustment`.
 */
export function orderAdjustment(
  order: AdjustableOrder
): { amount: number; label: string } | null {
  if (order.paymentAdjustment && order.paymentAdjustment.amount !== 0) {
    return order.paymentAdjustment;
  }
  if (order.discount && order.discount > 0) {
    return { amount: -order.discount, label: "Descuento" };
  }
  return null;
}
