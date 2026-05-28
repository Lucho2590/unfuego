"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col bg-background border-border w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tu carrito</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Tu carrito está vacío
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-border px-4">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>

            <div className="mt-auto space-y-4 px-4 pb-4">
              <CartSummary />
              <Button asChild className="w-full" size="lg">
                <Link
                  href="/checkout"
                  onClick={() => onOpenChange(false)}
                >
                  Ir al checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
