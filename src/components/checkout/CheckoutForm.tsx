"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CartSummary } from "@/components/cart/CartSummary";
import { toast } from "sonner";
import Image from "next/image";

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          shipping: {
            address: form.address,
            city: form.city,
            province: form.province,
            postalCode: form.postalCode,
            notes: form.notes || undefined,
          },
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el pedido");
      }

      clearCart();
      window.location.href = data.initPoint;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al procesar el pedido"
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg mb-4">
          Tu carrito está vacío
        </p>
        <Button onClick={() => router.push("/tienda")} variant="outline">
          Ir a la tienda
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
      {/* Form fields */}
      <div className="lg:col-span-3 space-y-8">
        {/* Contact */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Datos de contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                required
                placeholder="+54 223 ..."
              />
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Dirección de envío</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                required
                placeholder="Calle y número"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                required
                placeholder="Mar del Plata"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={form.province}
                onChange={(e) => updateField("province", e.target.value)}
                required
                placeholder="Buenos Aires"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Código postal</Label>
              <Input
                id="postalCode"
                value={form.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                required
                placeholder="7600"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Instrucciones de entrega, entre calles, etc."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Order summary */}
      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-lg border border-border/50 bg-card p-6 space-y-4">
          <h2 className="text-lg font-medium">Resumen del pedido</h2>

          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 py-3">
                <div className="relative w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    x{item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium">
                  ${(item.price * item.quantity).toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </div>

          <CartSummary />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Pagar con MercadoPago"}
          </Button>
        </div>
      </div>
    </form>
  );
}
