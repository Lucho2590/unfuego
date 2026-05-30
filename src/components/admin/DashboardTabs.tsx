"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "./DashboardStats";
import { BarChart3, ShoppingCart, Eye, TrendingUp } from "lucide-react";
import type { Order, Product } from "@/lib/types";

interface ProductView {
  id: string;
  productName: string;
  views: number;
  slug?: string;
}

interface AbandonedCart {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  email?: string | null;
  total: number;
  itemCount: number;
  createdAt: string;
}

interface DashboardTabsProps {
  orders: Order[];
  products: Product[];
  productViews: ProductView[];
  abandonedCarts: unknown[];
}

export function DashboardTabs({
  orders,
  products,
  productViews,
  abandonedCarts: rawCarts,
}: DashboardTabsProps) {
  const abandonedCarts = rawCarts as AbandonedCart[];

  // E-commerce metrics
  const approvedOrders = orders.filter(
    (o) => o.status === "approved" || o.status === "shipped" || o.status === "delivered"
  );
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = approvedOrders.length > 0 ? totalRevenue / approvedOrders.length : 0;

  // Conversion rate: approved orders / total orders
  const conversionRate =
    orders.length > 0
      ? ((approvedOrders.length / orders.length) * 100).toFixed(1)
      : "0";

  // Top products by views
  const topViewed = [...productViews].sort((a, b) => b.views - a.views).slice(0, 10);

  // Recent abandoned carts
  const recentAbandoned = abandonedCarts.slice(0, 10);

  // Abandoned cart value
  const abandonedValue = abandonedCarts.reduce((sum, c) => sum + (c.total ?? 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-light">Dashboard</h1>
      <DashboardStats orders={orders} products={products} />

      <Tabs defaultValue="ecommerce" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ecommerce" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            E-Commerce
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Google Analytics
          </TabsTrigger>
        </TabsList>

        {/* E-Commerce Tab */}
        <TabsContent value="ecommerce" className="space-y-6">
          {/* Quick metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Ticket promedio</p>
              <p className="text-2xl font-semibold mt-1">
                ${avgOrderValue.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Tasa de conversión</p>
              <p className="text-2xl font-semibold mt-1">{conversionRate}%</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Carritos abandonados</p>
              <p className="text-2xl font-semibold mt-1">{abandonedCarts.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ${abandonedValue.toLocaleString("es-AR")} en ventas perdidas
              </p>
            </div>
          </div>

          {/* Two columns: Top products + Abandoned carts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top viewed products */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Productos más vistos</h2>
              </div>
              <div className="divide-y divide-border">
                {topViewed.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Sin datos todavía
                  </div>
                ) : (
                  topViewed.map((pv, i) => (
                    <div key={pv.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">
                          {i + 1}.
                        </span>
                        <span className="text-sm">{pv.productName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {pv.views} {pv.views === 1 ? "vista" : "vistas"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Abandoned carts */}
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Carritos abandonados</h2>
              </div>
              <div className="divide-y divide-border">
                {recentAbandoned.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Sin carritos abandonados
                  </div>
                ) : (
                  recentAbandoned.map((cart) => (
                    <div key={cart.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">
                            {cart.itemCount} {cart.itemCount === 1 ? "producto" : "productos"}
                          </p>
                          {cart.email && (
                            <p className="text-xs text-muted-foreground">
                              {cart.email}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(cart.createdAt).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          ${cart.total?.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-medium">Pedidos recientes</h2>
            </div>
            <div className="divide-y divide-border">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer.name} — {order.customer.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${order.total.toLocaleString("es-AR")}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No hay pedidos todavía
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Google Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-medium mb-4">Google Analytics</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Para ver las analíticas de tu sitio, conectá tu cuenta de Google Analytics.
              Tu Measurement ID es: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">G-G7ZELVR7TX</code>
            </p>

            <div className="space-y-4">
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Embebé tu dashboard de Google Analytics acá
                </p>
                <p className="text-xs text-muted-foreground">
                  Andá a Google Analytics → Informes → Compartir → Obtener enlace del informe,
                  y pegalo abajo.
                </p>
              </div>

              <div className="space-y-2">
                <AnalyticsEmbed />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsEmbed() {
  // The embed URL is stored in localStorage so admin can set it
  const storageKey = "unfuego-analytics-url";

  return (
    <AnalyticsEmbedClient storageKey={storageKey} />
  );
}

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function AnalyticsEmbedClient({ storageKey }: { storageKey: string }) {
  const [url, setUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setSavedUrl(saved);
      setUrl(saved);
    }
  }, [storageKey]);

  const handleSave = () => {
    localStorage.setItem(storageKey, url);
    setSavedUrl(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">URL del informe embebido de Google Analytics</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://lookerstudio.google.com/embed/..."
            className="text-xs"
          />
        </div>
        <Button size="sm" onClick={handleSave} variant="outline">
          Guardar
        </Button>
      </div>

      {savedUrl && (
        <iframe
          src={savedUrl}
          className="w-full rounded-md border border-border"
          style={{ height: "600px" }}
          allowFullScreen
        />
      )}
    </div>
  );
}
