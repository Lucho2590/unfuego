import { NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/lib/firebase/orders";
import {
  sendTransferReceiptReceived,
  sendTransferReceiptAdminNotification,
} from "@/lib/email/send";
import type { Order } from "@/lib/types";

/**
 * El comprador adjunta el comprobante de transferencia (ya subido a Storage por el cliente).
 * Validamos que la orden exista, sea de transferencia y no esté ya confirmada, para evitar
 * que se pisen pedidos completados o que se escriban campos sensibles desde el cliente.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { receiptUrl, token } = (await request.json()) as {
      receiptUrl?: string;
      token?: string;
    };

    if (!receiptUrl || typeof receiptUrl !== "string") {
      return NextResponse.json({ error: "receiptUrl requerido" }, { status: 400 });
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (order.paymentProvider !== "transfer") {
      return NextResponse.json({ error: "La orden no es por transferencia" }, { status: 400 });
    }
    // El token (del link del email) gatea la subida: sin él, nadie con solo el orderId
    // puede adjuntar comprobantes.
    if (!token || token !== order.bankTransfer?.accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
    }
    // No permitir adjuntar comprobante si ya está confirmada/rechazada.
    if (order.paymentStatus === "completed" || order.paymentStatus === "failed") {
      return NextResponse.json(
        { error: "El pago de esta orden ya fue resuelto" },
        { status: 409 }
      );
    }

    await updateOrder(id, {
      paymentStatus: "processing",
      bankTransfer: {
        ...order.bankTransfer,
        receiptUrl,
      },
    } as Partial<Omit<Order, "id">>);

    const orderWithReceipt: Order = {
      ...order,
      bankTransfer: { ...order.bankTransfer, receiptUrl },
    };

    try {
      await sendTransferReceiptReceived(orderWithReceipt);
    } catch (emailError) {
      console.error("Error enviando email de comprobante recibido:", emailError);
    }

    try {
      await sendTransferReceiptAdminNotification(orderWithReceipt);
    } catch (emailError) {
      console.error("Error enviando aviso de comprobante al admin:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Receipt upload error:", error);
    return NextResponse.json({ error: "Error al adjuntar el comprobante" }, { status: 500 });
  }
}
