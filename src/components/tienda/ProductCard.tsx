import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.[0];

  return (
    <div className="group rounded-lg border border-border/50 bg-card overflow-hidden transition-colors hover:border-border">
      <Link href={`/tienda/${product.slug}`} className="block">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">🔥</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-2">
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-lg font-semibold">
            ${product.price.toLocaleString("es-AR")}
          </p>
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </div>
  );
}
