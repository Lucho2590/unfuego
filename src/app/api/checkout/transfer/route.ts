import { NextResponse } from "next/server";
import { createTransferOrder, getOrderById, updateOrder } from "@/lib/firebase/orders";
import { checkoutSchema } from "@/lib/validations/checkout";
import { getTransferSettings } from "@/lib/transfer/settings";
import { sendTransferInstructions, sendTransferAdminNotification } from "@/lib/email/send";
import type { Order, OrderItem } from "@/lib/types";

const SHIPPING_COST = Number(process.env.SHIPPING_COST ?? 2500);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.unfuegomdq.com.ar";

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    const settings = await getTransferSettings();
    if (!settings.enabled) {
      return NextResponse.json(
        { error: "La transferencia no está disponible en este momento" },
        { status: 503 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );
    const discount = Math.round((subtotal * settings.discountPercent) / 100);
    const total = subtotal - discount + SHIPPING_COST;

    const orderId = await createTransferOrder(
      parsed.data,
      items,
      subtotal,
      SHIPPING_COST,
      total,
      discount
    );

    // Emails (no bloquean el checkout si fallan).
    try {
      const order = await getOrderById(orderId);
      if (order) {
        const token = order.bankTransfer?.accessToken ?? "";
        const trackUrl = `${BASE_URL}/checkout/transferencia?order=${orderId}&token=${token}`;
        await sendTransferInstructions(order, settings, trackUrl);
        await sendTransferAdminNotification(order);
        await updateOrder(orderId, {
          emailsSent: { confirmation: false, adminNotification: true },
        } as Partial<Omit<Order, "id">>);
      }
    } catch (emailError) {
      console.error("Error enviando emails de transferencia:", emailError);
    }

    return NextResponse.json({ orderId });
  } catch (error) {
    console.error("Checkout transfer error:", error);
    return NextResponse.json({ error: "Error al procesar el pedido" }, { status: 500 });
  }
}
