import { resend } from "@/lib/resend";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { NewOrderAdminEmail } from "./templates/new-order-admin";
import { TransferInstructionsEmail } from "./templates/transfer-instructions";
import { NewTransferAdminEmail } from "./templates/new-transfer-admin";
import { TransferReceiptReceivedEmail } from "./templates/transfer-receipt-received";
import { TransferRejectedEmail } from "./templates/transfer-rejected";
import { OrderShippedEmail } from "./templates/order-shipped";
import type { Order, TransferSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const FROM_EMAIL = process.env.EMAIL_FROM ?? "Un Fuego <pedidos@unfuegomdq.com.ar>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function sendOrderConfirmation(order: Order) {
  if (!order.customer.email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.customer.email,
    subject: `Tu pedido ${order.orderNumber} fue confirmado - Un Fuego`,
    react: OrderConfirmationEmail({ order }),
  });
}

export async function sendAdminNotification(order: Order) {
  if (!ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Nuevo pedido ${order.orderNumber} - ${formatCurrency(order.total)}`,
    react: NewOrderAdminEmail({ order }),
  });
}

// ─── Transferencia bancaria ───

/** Al crear el pedido: datos bancarios + monto + nº de pedido + link para subir comprobante. */
export async function sendTransferInstructions(
  order: Order,
  settings: TransferSettings,
  trackUrl: string
) {
  if (!resend || !order.customer.email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.customer.email,
    subject: `Completá tu pago por transferencia - Pedido ${order.orderNumber}`,
    react: TransferInstructionsEmail({ order, settings, trackUrl }),
  });
}

/** Aviso al admin de un nuevo pedido por transferencia a revisar. */
export async function sendTransferAdminNotification(order: Order) {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Nuevo pedido por transferencia ${order.orderNumber} - ${formatCurrency(order.total)}`,
    react: NewTransferAdminEmail({ order }),
  });
}

/** Al subir el comprobante: confirmamos que lo recibimos y está en revisión. */
export async function sendTransferReceiptReceived(order: Order) {
  if (!resend || !order.customer.email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.customer.email,
    subject: `Recibimos tu comprobante - Pedido ${order.orderNumber}`,
    react: TransferReceiptReceivedEmail({ order }),
  });
}

/** Al rechazar la transferencia: aviso al cliente. */
export async function sendTransferRejected(order: Order) {
  if (!resend || !order.customer.email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.customer.email,
    subject: `No pudimos validar tu transferencia - Pedido ${order.orderNumber}`,
    react: TransferRejectedEmail({ order }),
  });
}

// ─── Despacho ───

/** Al despachar el pedido: número de guía + link de seguimiento. */
export async function sendOrderShipped(order: Order) {
  if (!resend || !order.customer.email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.customer.email,
    subject: `Tu pedido ${order.orderNumber} fue despachado - Un Fuego`,
    react: OrderShippedEmail({ order }),
  });
}
