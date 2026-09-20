import { NextResponse } from "next/server";
import { getProductById } from "@/lib/firebase/products";
import { sanitizePaymentAdjustments } from "@/lib/pricing";

// Tope defensivo: el carrito real nunca se acerca a esto.
const MAX_IDS = 50;

/**
 * Ajustes por medio de pago de los productos del carrito. Los consume el CheckoutForm
 * para mostrar el total correcto al elegir el medio; el dato no es sensible (sale del
 * precio que el comprador va a ver igual).
 *
 * POST y no GET: la lista de ids es variable y no queremos que se cachee, justamente
 * el punto es leer el valor fresco. Usa `getProductById`, que no pasa por el Data Cache.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids: unknown = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ adjustments: {} });
    }

    const unique = [...new Set(ids.filter((id): id is string => typeof id === "string"))]
      .slice(0, MAX_IDS);

    const products = await Promise.all(unique.map((id) => getProductById(id)));

    const adjustments: Record<string, unknown> = {};
    for (const product of products) {
      // Ids desconocidos se ignoran en silencio: el server recalcula antes de cobrar.
      if (!product) continue;
      adjustments[product.id] = sanitizePaymentAdjustments(product.paymentAdjustments);
    }

    return NextResponse.json({ adjustments });
  } catch (error) {
    console.error("Error leyendo ajustes por medio de pago:", error);
    // Sin ajustes antes que romper el checkout: el total autoritativo lo arma el server.
    return NextResponse.json({ adjustments: {} });
  }
}
