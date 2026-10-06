import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn, formatCurrency, getProductPrice } from "@/lib/utils";
import { ImagePlaceholder } from "@/components/common/ImagePlaceholder";
import { AddToCartButton } from "./AddToCartButton";

// Anchos reales de la columna: la grilla es 1/2/3 columnas dentro de un `max-w-6xl`, así que
// arriba de 1280px la card nunca pasa de 368px. Declararlo evita que el browser se pida
// variantes de 1080/1920 para un hueco de 368.
const CARD_SIZES =
  "(min-width: 1280px) 368px, (min-width: 1024px) calc(33.3vw - 59px), (min-width: 768px) calc(50vw - 76px), (min-width: 640px) calc(50vw - 36px), calc(100vw - 48px)";

interface ProductCardProps {
  product: Product;
  /** Las primeras tarjetas son el LCP de la tienda: se precargan en vez de ir lazy. */
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const mainImage = product.images?.[0];
  const priceInfo = getProductPrice(product);
  const comingSoon = !!product.comingSoon;

  const image = mainImage ? (
    <div className="relative aspect-square bg-product-surface overflow-hidden">
      <Image
        src={mainImage}
        alt={product.name}
        fill
        // `object-contain` + padding: la foto entra entera, nunca se recorta el producto.
        // El padding va en el <img> (con border-box, achica la content box que usa contain)
        // y de paso hace de colchón para el scale del hover.
        className={cn(
          "object-contain p-3 transition-transform duration-300",
          !comingSoon && "group-hover:scale-105"
        )}
        sizes={CARD_SIZES}
        quality={70}
        priority={priority}
      />
    </div>
  ) : (
    <ImagePlaceholder className="aspect-square" />
  );

  return (
    <div className="group flex h-full flex-col rounded-lg border border-border/50 bg-card overflow-hidden transition-colors hover:border-border">
      {/* Los productos "Próximamente" no tienen ficha: no son clickeables. */}
      {comingSoon ? (
        image
      ) : (
        <Link href={`/tienda/${product.slug}`} className="block">
          {image}
        </Link>
      )}

      <div className="p-4 flex flex-1 flex-col">
        {comingSoon ? (
          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
        ) : (
          <Link href={`/tienda/${product.slug}`}>
            <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
        )}

        {product.shortDescription && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto pt-3">
          {comingSoon ? (
            // Sin precio: solo la tag atenuada.
            <div className="flex">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Próximamente
              </span>
            </div>
          ) : (
            // Bloque de precio. El tachado y la descripción reservan su línea
            // siempre, para que el renglón del precio + botón quede alineado.
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
