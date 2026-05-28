import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mercadopago } from "@/lib/mercadopago";
import { updateOrder, getOrderById } from "@/lib/firebase/orders";
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // MercadoPago sends different notification types
    if (body.type === "payment" || body.action === "payment.updated") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Verify payment with MercadoPago API
      const payment = new Payment(mercadopago);
      const paymentData = await payment.get({ id: paymentId });

      const orderId = paymentData.external_reference;
      if (!orderId) {
        console.error("No external_reference in payment", paymentId);
        return NextResponse.json({ received: true });
      }

      const order = await getOrderById(orderId);
      if (!order) {
        console.error("Order not found:", orderId);
        return NextResponse.json({ received: true });
      }

      // Map MercadoPago status to our order status
      let orderStatus: string = order.status;
      if (paymentData.status === "approved") {
        orderStatus = "approved";
      } else if (paymentData.status === "rejected") {
        orderStatus = "rejected";
      } else if (
        paymentData.status === "pending" ||
        paymentData.status === "in_process"
      ) {
        orderStatus = "pending";
      }

      // Update order
      await updateOrder(orderId, {
        status: orderStatus as "approved" | "rejected" | "pending",
        mercadopago: {
          preferenceId: order.mercadopago.preferenceId,
          paymentId: String(paymentId),
          paymentStatus: paymentData.status ?? undefined,
          merchantOrderId: paymentData.order?.id
            ? String(paymentData.order.id)
            : undefined,
        },
      });

      // Send emails on approved payment
      if (paymentData.status === "approved" && !order.emailsSent.confirmation) {
        try {
          await sendOrderConfirmation(order);
          await sendAdminNotification(order);
          await updateOrder(orderId, {
            emailsSent: {
              confirmation: true,
              adminNotification: true,
            },
          });
        } catch (emailError) {
          console.error("Error sending emails:", emailError);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to MercadoPago to prevent retries
    return NextResponse.json({ received: true });
  }
}
