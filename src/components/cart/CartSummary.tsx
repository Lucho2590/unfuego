"use client";

import { useCartStore } from "@/lib/store/cart";

const SHIPPING_COST = Number(process.env.NEXT_PUBLIC_SHIPPING_COST ?? 2500);

export function CartSummary() {
  const subtotal = useCartStore((s) => s.getSubtotal());
  const total = subtotal + SHIPPING_COST;

  return (
    <div className="space-y-2 pt-3 border-t border-border">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>${subtotal.toLocaleString("es-AR")}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Envío</span>
        <span>${SHIPPING_COST.toLocaleString("es-AR")}</span>
      </div>
      <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
        <span>Total</span>
        <span>${total.toLocaleString("es-AR")}</span>
      </div>
    </div>
  );
}
