import { fsGet, fsQuery, fsAdd, fsUpdate } from "./admin";
import type { Order, OrderStatus, CheckoutFormData, OrderItem } from "../types";

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
