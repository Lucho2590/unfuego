"use client";

import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils";
import { PUBLIC_SHIPPING_COST, type PricingResult } from "@/lib/pricing";

interface CartSummaryProps {
  /**
   * Resultado de `computePricing` para el medio de pago elegido. Sin esto (el caso del
   * cart drawer) se muestra el precio base: los ajustes por medio de pago solo se ven
   * en el checkout.
   */
  pricing?: PricingResult;
}

export function CartSummary({ pricing }: CartSummaryProps) {
  const storeSubtotal = useCartStore((s) => s.getSubtotal());

  const subtotal = pricing?.subtotal ?? storeSubtotal;
  const adjustment = pricing?.adjustment ?? 0;
  const shippingCost = pricing?.shippingCost ?? PUBLIC_SHIPPING_COST;
  const total = pricing?.total ?? storeSubtotal + PUBLIC_SHIPPING_COST;

  return (
    <div className="space-y-2 pt-3 border-t border-border">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {adjustment !== 0 && (
        <div
          className={`flex justify-between text-sm ${
            adjustment < 0 ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          <span>{pricing?.adjustmentLabel}</span>
          <span>
            {adjustment < 0 ? "−" : "+"}
            {formatCurrency(Math.abs(adjustment))}
          </span>
        </div>
      )}
      {shippingCost > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Envío</span>
          <span>{formatCurrency(shippingCost)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
