import { getProductById } from "@/lib/firebase/products";
import { getProductPrice } from "@/lib/utils";
import { sanitizePaymentAdjustments } from "@/lib/pricing";
import type { AdjustmentMap } from "@/lib/pricing";
import type { OrderItem, PaymentProvider } from "@/lib/types";

/**
 * Relee los productos del carrito desde Firestore para resolver los ajustes por medio
 * de pago. Nunca se confía en el cliente para esto: del body solo se usan productId y
 * quantity.
 *
 * De paso loguea (sin bloquear) si el precio unitario que mandó el cliente ya no
 * coincide con el de la DB. Hoy las rutas de checkout confían en ese precio; rechazar
 * la compra rompería carritos viejos y necesita UX de "refrescá el carrito", así que
 * por ahora solo se deja registro.
 */
export async function resolveAdjustments(
  items: OrderItem[],
  method: PaymentProvider
): Promise<AdjustmentMap> {
  const ids = [...new Set(items.map((item) => item.productId))];
  const products = await Promise.all(ids.map((id) => getProductById(id)));

  const adjustments: AdjustmentMap = {};
  const drift: string[] = [];

  for (const product of products) {
    if (!product) continue;
    adjustments[product.id] = sanitizePaymentAdjustments(product.paymentAdjustments)[method];

    const fresh = getProductPrice(product).final;
    const sent = items.find((item) => item.productId === product.id)?.price;
    if (sent !== fresh) drift.push(`${product.id}: cliente ${sent} vs DB ${fresh}`);
  }

  if (drift.length > 0) {
    console.warn("Precios del carrito desactualizados:", drift.join(" | "));
  }

  return adjustments;
}
