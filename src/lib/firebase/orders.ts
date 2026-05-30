import crypto from "crypto";
import { fsGet, fsQuery, fsAdd, fsUpdate } from "./admin";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  CheckoutFormData,
  OrderItem,
} from "../types";
import { sendOrderConfirmation, sendAdminNotification } from "../email/send";

async function getNextOrderNumber(): Promise<string> {
  const counter = await fsGet("counters", "orders") as Record<string, unknown> | null;
  const current = (counter?.current as number) ?? 0;
  const next = current + 1;

  // Try update, if fails (doc doesn't exist), will be caught by caller
  try {
    await fsUpdate("counters", "orders", { current: next });
  } catch {
    // Counter doc doesn't exist yet, create it via a direct PATCH that creates
    await fsAdd("counters", { current: next });
  }

  return `UF-${String(next).padStart(4, "0")}`;
}

export async function createOrder(
  data: CheckoutFormData,
  items: OrderItem[],
  subtotal: number,
  shippingCost: number,
  total: number
): Promise<string> {
  const orderNumber = await getNextOrderNumber();

  const order = {
    orderNumber,
    status: "pending" as OrderStatus,
    customer: data.customer,
    shipping: data.shipping,
    items,
    subtotal,
    shippingCost,
    total,
    mercadopago: {
      preferenceId: "",
    },
    emailsSent: {
      confirmation: false,
      adminNotification: false,
    },
  };

  return await fsAdd("orders", order as unknown as Record<string, unknown>);
}

/**
 * Crea una orden pagada por transferencia bancaria (sin preference de MercadoPago).
 * Queda en paymentStatus "pending" hasta que el comprador suba el comprobante
 * (→ "processing") y el admin confirme (→ "completed").
 */
export async function createTransferOrder(
  data: CheckoutFormData,
  items: OrderItem[],
  subtotal: number,
  shippingCost: number,
  total: number,
  discount: number
): Promise<string> {
  const orderNumber = await getNextOrderNumber();

  const order = {
    orderNumber,
    status: "pending" as OrderStatus,
    paymentStatus: "pending" as PaymentStatus,
    paymentProvider: "transfer" as const,
    customer: data.customer,
    shipping: data.shipping,
    items,
    subtotal,
    shippingCost,
    discount,
    total,
    bankTransfer: {
      // Token de acceso: solo se envía en el link del email.
      accessToken: crypto.randomUUID(),
    },
    emailsSent: {
      confirmation: false,
      adminNotification: false,
    },
  };

  return await fsAdd("orders", order as unknown as Record<string, unknown>);
}

export async function updateOrder(
  orderId: string,
  data: Partial<Omit<Order, "id">>
): Promise<void> {
  await fsUpdate("orders", orderId, data as Record<string, unknown>);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const doc = await fsGet("orders", orderId);
  return (doc as unknown as Order) ?? null;
}

export async function getOrders(status?: OrderStatus): Promise<Order[]> {
  const filters = status
    ? [{ field: "status", op: "EQUAL" as const, value: status }]
    : undefined;

  const docs = await fsQuery(
    "orders",
    filters,
    { field: "createdAt", direction: "DESCENDING" }
  );
  return docs as unknown as Order[];
}

/**
 * Trae una orden reintentando con backoff. Cubre la race condition de que el webhook
 * de MercadoPago llegue antes de que la orden esté visible en Firestore.
 */
export async function fetchOrderWithRetry(
  orderId: string,
  delays: number[] = [100, 500, 2500]
): Promise<Order | null> {
  let order = await getOrderById(orderId);
  for (const delay of delays) {
    if (order) return order;
    await new Promise((r) => setTimeout(r, delay));
    order = await getOrderById(orderId);
  }
  return order;
}

/** Deriva el `status` legacy (logístico) a partir del estado de pago normalizado. */
function deriveLegacyStatus(payment: PaymentStatus, current: OrderStatus): OrderStatus {
  switch (payment) {
    case "completed":
      return "approved";
    case "failed":
      return "rejected";
    case "refunded":
      return "cancelled";
    case "processing":
    case "pending":
      // No pisar estados logísticos posteriores (shipped/delivered) si ya avanzaron.
      return current === "approved" ? current : "pending";
    default:
      return current;
  }
}

/**
 * Envía los emails de confirmación (cliente + admin) una sola vez y marca emailsSent.
 * Idempotente: si ya se enviaron, no hace nada. Resiliente a fallos de email.
 */
export async function processCompletedOrder(order: Order): Promise<void> {
  if (order.emailsSent?.confirmation) return;
  try {
    await sendOrderConfirmation(order);
    await sendAdminNotification(order);
    await updateOrder(order.id, {
      emailsSent: { confirmation: true, adminNotification: true },
    });
  } catch (error) {
    console.error("Error enviando emails de la orden", order.id, error);
  }
}

interface UpdatePaymentExtra {
  /** Estado crudo de MercadoPago (para guardar en mercadopago.paymentStatus). */
  mpStatus?: string;
  merchantOrderId?: string;
}

/**
 * Actualiza el estado de pago de una orden de forma idempotente.
 * - Escribe `paymentStatus` (normalizado) y deriva el `status` legacy para el panel.
 * - Si pasa a `completed` y aún no se enviaron emails, dispara processCompletedOrder.
 * - Si el estado y el paymentId ya coinciden (y los emails ya se mandaron en caso de
 *   completed), devuelve `{ skipped: true }` sin escribir.
 */
export async function updateOrderPayment(
  orderId: string,
  paymentId: string | number | undefined,
  status: PaymentStatus,
  extra: UpdatePaymentExtra = {}
): Promise<{ skipped: boolean }> {
  const order = await fetchOrderWithRetry(orderId);
  if (!order) {
    throw new Error(`Orden no encontrada: ${orderId}`);
  }

  const paymentIdStr = paymentId != null ? String(paymentId) : order.mercadopago?.paymentId;

  const samePayment =
    order.paymentStatus === status &&
    order.mercadopago?.paymentId === paymentIdStr &&
    (status !== "completed" || order.emailsSent?.confirmation);

  if (samePayment) {
    return { skipped: true };
  }

  const legacyStatus = deriveLegacyStatus(status, order.status);

  await updateOrder(orderId, {
    status: legacyStatus,
    paymentStatus: status,
    // Solo reescribir el bloque mercadopago si la orden lo tiene (las de transferencia no).
    ...(order.mercadopago
      ? {
          mercadopago: {
            preferenceId: order.mercadopago.preferenceId,
            paymentId: paymentIdStr,
            paymentStatus: extra.mpStatus ?? order.mercadopago.paymentStatus,
            merchantOrderId: extra.merchantOrderId ?? order.mercadopago.merchantOrderId,
          },
        }
      : {}),
  });

  if (status === "completed" && !order.emailsSent?.confirmation) {
    // Reusar el objeto en memoria con el estado ya actualizado para los emails.
    await processCompletedOrder({ ...order, status: legacyStatus, paymentStatus: status });
  }

  return { skipped: false };
}
