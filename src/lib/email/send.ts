import { resend } from "@/lib/resend";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { NewOrderAdminEmail } from "./templates/new-order-admin";
import type { Order } from "@/lib/types";

const FROM_EMAIL = "Un Fuego <pedidos@unfuegomdq.com.ar>";
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
    subject: `Nuevo pedido ${order.orderNumber} - $${order.total.toLocaleString("es-AR")}`,
    react: NewOrderAdminEmail({ order }),
  });
}
