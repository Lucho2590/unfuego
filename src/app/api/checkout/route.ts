import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { mercadopago } from "@/lib/mercadopago";
import { createOrder, updateOrder } from "@/lib/firebase/orders";
import { checkoutSchema } from "@/lib/validations/checkout";
import type { OrderItem } from "@/lib/types";

const SHIPPING_COST = Number(process.env.SHIPPING_COST ?? 2500);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.unfuegomdq.com.ar";

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
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + SHIPPING_COST;

    // Create order in database
    const orderId = await createOrder(
      parsed.data,
      items,
      subtotal,
      SHIPPING_COST,
      total
    );

    // Create MercadoPago preference
    const preference = new Preference(mercadopago);
    const result = await preference.create({
      body: {
        items: items.map((item: OrderItem) => ({
          id: item.productId,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: "ARS",
        })),
        shipments: {
          cost: SHIPPING_COST,
          mode: "not_specified",
        },
        payer: {
          name: parsed.data.customer.name,
          email: parsed.data.customer.email,
          phone: {
            number: parsed.data.customer.phone,
          },
        },
        back_urls: {
          success: `${BASE_URL}/checkout/confirmacion`,
          failure: `${BASE_URL}/checkout/confirmacion`,
          pending: `${BASE_URL}/checkout/confirmacion`,
        },
        auto_return: "approved",
        external_reference: orderId,
        notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
      },
    });

    // Save preference ID to order
    await updateOrder(orderId, {
      mercadopago: {
        preferenceId: result.id!,
      },
    });

    return NextResponse.json({
      orderId,
      preferenceId: result.id,
      initPoint: result.init_point,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido" },
      { status: 500 }
    );
  }
}
