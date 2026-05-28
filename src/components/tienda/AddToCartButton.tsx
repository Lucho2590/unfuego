"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/lib/types";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  size?: "default" | "sm" | "lg";
}

export function AddToCartButton({
  product,
  quantity = 1,
  size = "default",
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    if (product.stock <= 0) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0] ?? "",
    });
  };

  const outOfStock = product.stock <= 0;

  return (
    <Button
      onClick={handleAdd}
      size={size}
      disabled={outOfStock}
      variant={outOfStock ? "secondary" : "default"}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {outOfStock ? "Sin stock" : "Agregar"}
    </Button>
  );
}
