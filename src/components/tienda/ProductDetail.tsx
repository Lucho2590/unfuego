"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductImageGallery } from "./ProductImageGallery";
import { AddToCartButton } from "./AddToCartButton";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      <ProductImageGallery
        images={product.images}
        productName={product.name}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">
            {product.name}
          </h1>
          <p className="text-2xl font-semibold mt-2">
            ${product.price.toLocaleString("es-AR")}
          </p>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          {product.description}
        </p>

        {product.stock > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Cantidad</span>
              <div className="flex items-center border border-border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-medium">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="p-2 hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {product.stock} disponibles
              </span>
            </div>

            <AddToCartButton
              product={product}
              quantity={quantity}
              size="lg"
            />
          </div>
        )}

        {product.stock <= 0 && (
          <p className="text-sm text-muted-foreground">
            Producto sin stock temporalmente
          </p>
        )}
      </div>
    </div>
  );
}
