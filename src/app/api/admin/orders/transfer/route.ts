import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, fsQuery } from "@/lib/firebase/admin";
import { getOrderById, updateOrder, updateOrderPayment } from "@/lib/firebase/orders";
import { sendTransferRejected } from "@/lib/email/send";
import type { Order } from "@/lib/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function requireAdminEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session?.value) return null;
  const user = await verifyIdToken(session.value);
  if (!user) return null;
  if (ADMIN_EMAILS.includes(user.email)) return user.email;
  try {
    const invitations = await fsQuery("admin_invitations", [
      { field: "email", op: "EQUAL", value: user.email },
    ]);
    if (invitations.length > 0) return user.email;
  } catch {
    // denegar
  }
  return null;
}

export async function PUT(request: Request) {
  const adminEmail = await requireAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { orderId, action } = (await request.json()) as {
      orderId?: string;
      action?: "confirm" | "reject";
    };

    if (!orderId || (action !== "confirm" && action !== "reject")) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (order.paymentProvider !== "transfer") {
      return NextResponse.json(
        { error: "La orden no es por transferencia" },
        { status: 400 }
      );
    }

    // Guardar quién y cuándo revisó.
    await updateOrder(orderId, {
      bankTransfer: {
        ...order.bankTransfer,
        reviewedBy: adminEmail,
        reviewedAt: new Date().toISOString(),
      },
    } as Partial<Omit<Order, "id">>);

    if (action === "confirm") {
      await updateOrderPayment(orderId, undefined, "completed");
    } else {
      await updateOrderPayment(orderId, undefined, "failed");
      try {
        const fresh = await getOrderById(orderId);
        if (fresh) await sendTransferRejected(fresh);
      } catch (emailError) {
        console.error("Error enviando email de rechazo:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Transfer review error:", error);
    return NextResponse.json({ error: "Error al revisar la transferencia" }, { status: 500 });
  }
}
