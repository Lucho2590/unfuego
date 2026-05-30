import { NextResponse } from "next/server";
import {
  getMercadoPagoContext,
  searchPaymentsByExternalReference,
} from "@/lib/mercadopago/client";
import { mapMercadoPagoStatus } from "@/lib/mercadopago/status";
import { getOrderById, updateOrderPayment } from "@/lib/firebase/orders";

/**
 * Polling de respaldo para la página de confirmación: por si el webhook se demora.
 * Busca el pago por external_reference (= orderId) en MercadoPago, actualiza la orden
 * si corresponde y devuelve el estado normalizado.
 *
 * GET /api/checkout/status?orderId=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Estado actual en DB (lo que ya escribió el webhook, si llegó).
    let paymentStatus = order.paymentStatus ?? "pending";
    let status = order.status;

    // Si todavía no está resuelto, consultar MercadoPago directamente.
    if (paymentStatus === "pending" || paymentStatus === "processing") {
      const ctx = await getMercadoPagoContext();
      if (ctx) {
        const payments = await searchPaymentsByExternalReference(ctx, orderId);
        const latest = payments[0];
        if (latest?.status) {
          const mapped = mapMercadoPagoStatus(latest.status);
          if (mapped !== paymentStatus) {
            await updateOrderPayment(orderId, latest.id, mapped, {
              mpStatus: latest.status,
            });
            const refreshed = await getOrderById(orderId);
            paymentStatus = refreshed?.paymentStatus ?? mapped;
            status = refreshed?.status ?? status;
          }
        }
      }
    }

    return NextResponse.json({ orderId, status, paymentStatus });
  } catch (error) {
    console.error("Checkout status error:", error);
    return NextResponse.json({ error: "Error al consultar el estado" }, { status: 500 });
  }
}
