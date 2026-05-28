import { getOrders } from "@/lib/firebase/orders";
import { getAllProducts } from "@/lib/firebase/products";
import { fsQuery } from "@/lib/firebase/admin";
import { DashboardTabs } from "@/components/admin/DashboardTabs";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orders, products, productViews, abandonedCarts] = await Promise.all([
    getOrders(),
    getAllProducts(),
    fsQuery("product_views", undefined, { field: "views", direction: "DESCENDING" }).catch(() => []),
    fsQuery("abandoned_carts", undefined, { field: "createdAt", direction: "DESCENDING" }).catch(() => []),
  ]);

  // Enrich product views with product names
  const productMap = new Map(products.map((p) => [p.id, p]));
  const enrichedViews = (productViews as { id: string; productId?: string; slug?: string; views?: number }[]).map((v) => {
    const product = productMap.get(v.productId ?? "") ?? products.find((p) => p.slug === v.slug);
    return {
      ...v,
      productName: (product as Product)?.name ?? v.slug ?? "Desconocido",
      views: v.views ?? 0,
    };
  });

  return (
    <DashboardTabs
      orders={orders}
      products={products}
      productViews={enrichedViews}
      abandonedCarts={abandonedCarts}
    />
  );
}
