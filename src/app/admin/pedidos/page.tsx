import { getOrders } from "@/lib/firebase/orders";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  shipped: "default",
  delivered: "default",
  rejected: "destructive",
  cancelled: "secondary",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  shipped: "Enviado",
  delivered: "Entregado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

export default async function AdminPedidosPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-light">Pedidos</h1>

      <div className="rounded-lg border border-border bg-card">
        <div className="divide-y divide-border">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/pedidos/${order.id}`}
              className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors block"
            >
              <div>
                <p className="text-sm font-medium">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customer.name} — {order.customer.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusColors[order.status] ?? "outline"}>
                  {statusLabels[order.status] ?? order.status}
                </Badge>
                <span className="text-sm font-medium">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </Link>
          ))}
          {orders.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No hay pedidos todavía
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
