"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/lib/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-3 py-3">
      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={item.image || "/images/placeholder.jpg"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(item.price)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            className="p-0.5 rounded hover:bg-muted transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            className="p-0.5 rounded hover:bg-muted transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <button
        onClick={() => removeItem(item.productId)}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
