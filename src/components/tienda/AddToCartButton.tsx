"use client";

import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";
import { cn, getProductPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  size?: "default" | "sm" | "lg";
  /**
   * `default`: botón con texto "Agregar" (ficha de producto).
   * `icon`: botón circular "+" para flotar sobre la imagen de la card. Si no hay stock no
   * renderiza nada: la card ya muestra la pill "Sin stock".
   */
  variant?: "default" | "icon";
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  size = "default",
  variant = "default",
  className,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

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

    toast.success(`${product.name} agregado al carrito`, {
      action: {
        label: "Ver carrito",
        onClick: () => openCart(),
      },
    });
  };

  if (variant === "icon") {
    if (outOfStock) return null;

    return (
      <button
        type="button"
        onClick={handleAdd}
        aria-label={`Agregar ${product.name} al carrito`}
        className={cn(
          "flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className
        )}
      >
        <Plus className="size-5" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <Button
      onClick={handleAdd}
      size={size}
      disabled={outOfStock}
      variant={outOfStock ? "secondary" : "default"}
      className={className}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {outOfStock ? "Sin stock" : "Agregar"}
    </Button>
  );
}
