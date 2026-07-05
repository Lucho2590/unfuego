"use client";

import { useState } from "react";
import { Minus, Plus, FileDown } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency, getProductPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductDescription } from "./ProductDescription";
import { AddToCartButton } from "./AddToCartButton";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const priceInfo = getProductPrice(product);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 md:items-start">
      <ProductImageGallery
        images={product.images}
        productName={product.name}
      />

      {/* Bloque de compra: precio + cantidad + agregar, pegado arriba */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">
            {product.name}
          </h1>
          {priceInfo.hasDiscount ? (
            <div className="mt-2 space-y-0.5">
              <p className="text-base text-muted-foreground line-through">
                {formatCurrency(priceInfo.original)}
              </p>
              <p className="text-2xl font-semibold text-primary">
                {formatCurrency(priceInfo.final)}
              </p>
              {priceInfo.description && (
                <p className="text-sm text-primary/90">{priceInfo.description}</p>
              )}
            </div>
          ) : (
            <p className="text-2xl font-semibold mt-2">
              {formatCurrency(product.price)}
            </p>
          )}
        </div>

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

        {product.manualUrl && (
          <Button asChild variant="outline" size="lg" className="w-full">
            <a
              href={product.manualUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Descargar manual (PDF)
            </a>
          </Button>
        )}
      </div>

      {/* Descripción a ancho completo, debajo de la foto y el bloque de compra */}
      <ProductDescription
        description={product.description}
        className="md:col-span-2"
      />
    </div>
  );
}
