import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import type { Order, Product } from "@/lib/types";

interface DashboardStatsProps {
  orders: Order[];
  products: Product[];
}

export function DashboardStats({ orders, products }: DashboardStatsProps) {
  const approvedOrders = orders.filter((o) => o.status === "approved" || o.status === "shipped" || o.status === "delivered");
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const stats = [
    {
      label: "Productos",
      value: products.length,
      icon: Package,
    },
    {
      label: "Pedidos totales",
      value: orders.length,
      icon: ShoppingBag,
    },
    {
      label: "Ingresos",
      value: `$${totalRevenue.toLocaleString("es-AR")}`,
      icon: DollarSign,
    },
    {
      label: "Pedidos pendientes",
      value: pendingOrders,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <stat.icon className="w-4 h-4" />
            <span className="text-sm">{stat.label}</span>
          </div>
          <p className="text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
