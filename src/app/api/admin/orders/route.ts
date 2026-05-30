import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken } from "@/lib/firebase/admin";
import { updateOrder, getOrderById } from "@/lib/firebase/orders";
import { sendOrderShipped } from "@/lib/email/send";
import type { Order } from "@/lib/types";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session?.value) return false;

  const user = await verifyIdToken(session.value);
  return !!user;
}

export async function PUT(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { orderId, status, tracking } = (await request.json()) as {
      orderId?: string;
      status?: string;
      tracking?: { number?: string; url?: string };
    };

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId y status requeridos" },
        { status: 400 }
      );
    }

    // Al despachar exigimos número de guía + link de seguimiento.
    if (status === "shipped") {
      const number = tracking?.number?.trim();
      const url = tracking?.url?.trim();
      if (!number || !url) {
        return NextResponse.json(
          { error: "Número de guía y link de seguimiento son requeridos" },
          { status: 400 }
        );
      }

      await updateOrder(orderId, {
        status,
        tracking: { number, url },
      } as Partial<Omit<Order, "id">>);

      // Email de despacho, una sola vez (idempotente).
      try {
        const order = await getOrderById(orderId);
        if (order && !order.emailsSent?.shipped) {
          await sendOrderShipped(order);
          await updateOrder(orderId, {
            emailsSent: { ...order.emailsSent, shipped: true },
          } as Partial<Omit<Order, "id">>);
        }
      } catch (emailError) {
        console.error("Error enviando email de despacho:", emailError);
      }

      return NextResponse.json({ success: true });
    }

    await updateOrder(orderId, { status: status as Order["status"] });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    );
  }
}
