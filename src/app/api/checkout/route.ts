import { NextResponse } from "next/server";
import {
  getMercadoPagoContext,
  createPreference,
  pickInitPoint,
  isPublicHttps,
} from "@/lib/mercadopago/client";
import { createOrder, updateOrder } from "@/lib/firebase/orders";
import { isMercadoPagoEnabled } from "@/lib/mercadopago/settings";
import { checkoutSchema } from "@/lib/validations/checkout";
import { computePricing } from "@/lib/pricing";
import { resolveAdjustments } from "@/lib/checkout/resolve-adjustments";
import type { OrderItem } from "@/lib/types";

const SHIPPING_COST = Number(process.env.SHIPPING_COST ?? 2500);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.unfuegomdq.com.ar";

/** Parte un nombre completo en nombre y apellido para el payer de MercadoPago. */
function splitName(full: string): { name: string; surname?: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { name: full.trim() };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate customer + shipping data
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const items: OrderItem[] = body.items;
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    if (!(await isMercadoPagoEnabled())) {
      return NextResponse.json(
        { error: "El pago con MercadoPago no está disponible en este momento" },
        { status: 503 }
      );
    }

    const ctx = await getMercadoPagoContext();
    if (!ctx) {
      console.error("Checkout: MercadoPago no está configurado");
      return NextResponse.json(
        { error: "El medio de pago no está disponible en este momento" },
        { status: 503 }
      );
    }

    // Los ajustes se releen de Firestore: el body del cliente no es autoritativo.
    const adjustments = await resolveAdjustments(items, "mercadopago");

    const pricing = computePricing({
      items: items.map((item: OrderItem) => ({
        productId: item.productId,
        price: item.price,
        quantity: item.quantity,
      })),
      method: "mercadopago",
      adjustments,
      shippingCost: SHIPPING_COST,
    });

    // Create order in database
    const orderId = await createOrder({
      data: parsed.data,
      items,
      subtotal: pricing.subtotal,
      shippingCost: SHIPPING_COST,
      total: pricing.total,
      paymentAdjustment:
        pricing.adjustment !== 0
          ? { amount: pricing.adjustment, label: pricing.adjustmentLabel }
          : null,
    });

    const { name, surname } = splitName(parsed.data.customer.name);
    const publicHttps = isPublicHttps(BASE_URL);

    // Items de la preference: productos + un item "Envío" si corresponde. El ajuste por
    // medio de pago va metido en el unit_price (MercadoPago no acepta montos negativos,
    // así que un descuento tiene que ir en el unitario igual).
    const preferenceItems = pricing.lines.map((line, index) => ({
      id: line.productId,
      title: items[index].name,
      quantity: line.quantity,
      unit_price: line.unit,
      currency_id: "ARS",
    }));
    if (SHIPPING_COST > 0) {
      preferenceItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: SHIPPING_COST,
        currency_id: "ARS",
      });
    }

    // Lo que cobra MercadoPago tiene que ser exactamente order.total. Se cumple por
    // construcción (computePricing redondea el unitario), esto es solo el fusible.
    const mpTotal = preferenceItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    if (mpTotal !== pricing.total) {
      throw new Error(
        `Preference desalineada con la orden ${orderId}: MP ${mpTotal} vs total ${pricing.total}`
      );
    }

    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { mode, result } = await createPreference(ctx, {
      items: preferenceItems,
      payer: {
        name,
        surname,
        email: parsed.data.customer.email,
        phone: { number: parsed.data.customer.phone },
      },
      back_urls: {
        success: `${BASE_URL}/checkout/confirmacion`,
        failure: `${BASE_URL}/checkout/confirmacion`,
        pending: `${BASE_URL}/checkout/confirmacion`,
      },
      // MercadoPago rechaza auto_return con URLs no públicas (localhost).
      ...(publicHttps ? { auto_return: "approved" as const } : {}),
      external_reference: orderId,
      notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "UNFUEGO",
      binary_mode: false,
      expires: true,
      expiration_date_to: expiration,
    });

    // Save preference ID to order
    await updateOrder(orderId, {
      mercadopago: { preferenceId: result.id! },
    });

    const initPoint = pickInitPoint(mode, result);

    return NextResponse.json({
      orderId,
      preferenceId: result.id,
      initPoint,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Error al procesar el pedido" }, { status: 500 });
  }
}
