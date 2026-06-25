"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";
import { getProductPrice } from "@/lib/utils";
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

  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (outOfStock) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      // Precio efectivo (con descuento si tiene): es lo que se cobra en el checkout.
      price: getProductPrice(product).final,
      quantity,
      image: product.images?.[0] ?? "",
    });
  };

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
