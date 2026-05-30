import { NextResponse } from "next/server";
import { getMercadoPagoContext, getPayment } from "@/lib/mercadopago/client";
import { getMercadoPagoSecrets } from "@/lib/mercadopago/settings";
import { verifyWebhookSignature } from "@/lib/mercadopago/signature";
import { mapMercadoPagoStatus } from "@/lib/mercadopago/status";
import { updateOrderPayment, getOrderById } from "@/lib/firebase/orders";
import { fsSet, fsUpdate } from "@/lib/firebase/admin";

/**
 * Webhook de MercadoPago.
 *
 * Seguridad:
 * - Verifica la firma HMAC-SHA256 (`x-signature`) contra el webhook secret del modo activo,
 *   con fallback al otro modo (cubre webhooks que llegan justo tras cambiar de modo). 401 si
 *   ninguno valida.
 * - Idempotencia: cada notificación crea un doc en `orders/{orderId}/events/{x-request-id}`
 *   con `createOnly`; si ya existe, se ignora (MercadoPago reintenta el mismo request-id).
 */
export async function POST(request: Request) {
  try {
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    // Body crudo para no alterar nada antes de parsear.
    const raw = await request.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // dataId del pago (varias formas según el tipo de notificación).
    const dataId =
      (body.data as { id?: string | number })?.id ??
      (body as { id?: string | number }).id;
    if (dataId == null) {
      return NextResponse.json({ received: true, ignored: "no data.id" });
    }

    // ── Verificación de firma contra ambos modos ──
    const secrets = await getMercadoPagoSecrets();
    const candidates = [
      { mode: secrets.activeMode, secret: secrets[secrets.activeMode]?.webhookSecret },
      {
        mode: secrets.activeMode === "test" ? "production" : "test",
        secret:
          secrets[secrets.activeMode === "test" ? "production" : "test"]?.webhookSecret,
      },
    ];

    let verifiedMode: string | null = null;
    for (const cand of candidates) {
      if (cand.secret && verifyWebhookSignature(xSignature, xRequestId, String(dataId), cand.secret)) {
        verifiedMode = cand.mode;
        break;
      }
    }

    if (!verifiedMode) {
      console.warn("Webhook MP: firma inválida", { dataId, xRequestId });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Solo procesamos eventos de pago.
    const eventType = (body.type as string) ?? (body.action as string) ?? "";
    if (!eventType.includes("payment")) {
      return NextResponse.json({ received: true, ignored: eventType });
    }

    // ── Traer el pago real desde la API de MP para conocer external_reference y estado ──
    const ctx = await getMercadoPagoContext();
    if (!ctx) {
      console.error("Webhook MP: sin credenciales activas");
      return NextResponse.json({ received: true });
    }

    const payment = await getPayment(ctx, dataId);
    const orderId = payment.external_reference;
    if (!orderId) {
      console.error("Webhook MP: pago sin external_reference", dataId);
      return NextResponse.json({ received: true, ignored: "no external_reference" });
    }

    // Guard defensivo: nunca tocar órdenes de transferencia desde el webhook de MP.
    const existing = await getOrderById(orderId);
    if (existing?.paymentProvider === "transfer") {
      return NextResponse.json({ received: true, ignored: "transfer order" });
    }

    // ── Idempotencia + audit trail ──
    const eventId = xRequestId ?? `${dataId}-${payment.status}`;
    const { created } = await fsSet(
      `orders/${orderId}/events`,
      sanitizeId(eventId),
      {
        receivedAt: new Date().toISOString(),
        source: "mercadopago",
        eventType,
        dataId: String(dataId),
        verifiedMode,
        paymentStatus: payment.status ?? "",
        processed: false,
      },
      { createOnly: true }
    );

    if (!created) {
      // Ya procesado antes (reintento de MP con el mismo request-id).
      return NextResponse.json({ received: true, idempotent: true });
    }

    // ── Mapear estado y actualizar la orden ──
    const mapped = mapMercadoPagoStatus(payment.status);
    const result = await updateOrderPayment(orderId, dataId, mapped, {
      mpStatus: payment.status ?? undefined,
      merchantOrderId: payment.order?.id ? String(payment.order.id) : undefined,
    });

    // Marcar el evento como procesado (update parcial: fsUpdate usa updateMask y preserva
    // el resto de los campos del audit).
    await fsUpdate(`orders/${orderId}/events`, sanitizeId(eventId), {
      processed: true,
      processedStatus: mapped,
      skipped: result.skipped,
    });

    return NextResponse.json({ received: true, status: mapped, skipped: result.skipped });
  } catch (error) {
    console.error("Webhook error:", error);
    // 200 para que MercadoPago no reintente indefinidamente ante errores nuestros.
    return NextResponse.json({ received: true });
  }
}

/** Firestore no permite "/" en IDs de documento. */
function sanitizeId(id: string): string {
  return id.replace(/\//g, "_");
}
