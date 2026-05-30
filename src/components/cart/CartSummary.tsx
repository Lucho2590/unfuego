"use client";

import { useCartStore } from "@/lib/store/cart";

const SHIPPING_COST = Number(process.env.NEXT_PUBLIC_SHIPPING_COST ?? 0);

interface CartSummaryProps {
  /** % de descuento a aplicar sobre el subtotal (ej. transferencia). 0 = sin descuento. */
  discountPercent?: number;
}

export function CartSummary({ discountPercent = 0 }: CartSummaryProps) {
  const subtotal = useCartStore((s) => s.getSubtotal());
  const discount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
  const total = subtotal - discount + SHIPPING_COST;

  return (
    <div className="space-y-2 pt-3 border-t border-border">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>${subtotal.toLocaleString("es-AR")}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Descuento transferencia ({discountPercent}%)</span>
          <span>−${discount.toLocaleString("es-AR")}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
        <span>Total</span>
        <span>${total.toLocaleString("es-AR")}</span>
      </div>
    </div>
  );
}
