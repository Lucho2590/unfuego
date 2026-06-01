import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn, formatCurrency, getProductPrice } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.[0];
  const priceInfo = getProductPrice(product);

  return (
    <div className="group flex h-full flex-col rounded-lg border border-border/50 bg-card overflow-hidden transition-colors hover:border-border">
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

      <div className="p-4 flex flex-1 flex-col">
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Bloque de precio anclado abajo. El tachado y la descripción reservan
            su línea siempre, para que el renglón del precio + botón quede
            alineado en todas las cards (tengan descuento o no). */}
        <div className="mt-auto pt-3">
          <p className="h-4 text-xs leading-4 text-muted-foreground line-through">
            {priceInfo.hasDiscount ? formatCurrency(priceInfo.original) : ""}
          </p>
          <div className="flex items-end justify-between gap-2">
            <p
              className={cn(
                "text-lg font-semibold",
                priceInfo.hasDiscount && "text-primary"
              )}
            >
              {formatCurrency(priceInfo.final)}
            </p>
            <AddToCartButton product={product} size="sm" />
          </div>
          <p className="h-4 mt-0.5 text-[11px] leading-4 text-primary/90 line-clamp-1">
            {priceInfo.description ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
