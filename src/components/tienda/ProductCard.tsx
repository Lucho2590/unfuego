import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn, formatCurrency, getProductPrice } from "@/lib/utils";
import { ImagePlaceholder } from "@/components/common/ImagePlaceholder";
import { AddToCartButton } from "./AddToCartButton";

// Anchos reales de la columna: la grilla es 2/3/4 columnas dentro de un `max-w-6xl` con
// padding lateral de 24px (mobile) o 64px (md+) y gap de 12/16/24px. Arriba de 1280px la
// card nunca pasa de 270px. Sin esto, `fill` pide la imagen al ancho del viewport.
const CARD_SIZES =
  "(min-width: 1280px) 270px, (min-width: 1024px) calc(25vw - 50px), (min-width: 768px) calc(33.3vw - 53px), (min-width: 640px) calc(50vw - 32px), calc(50vw - 30px)";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  priority?: boolean;
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute top-2 left-2 z-10 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
      {children}
    </span>
  );
}

export function ProductCard({
  product,
  categoryName,
  priority = false,
}: ProductCardProps) {
  const mainImage = product.images?.[0];
  const priceInfo = getProductPrice(product);
  const comingSoon = !!product.comingSoon;
  const outOfStock = !comingSoon && product.stock <= 0;
  const interactive = !comingSoon;

  const content = (
    <>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-product-surface">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className={cn(
              "object-contain p-3 transition-transform duration-300",
              interactive && "group-hover:scale-105",
              comingSoon && "opacity-60"
            )}
            sizes={CARD_SIZES}
            quality={70}
            priority={priority}
          />
        ) : (
          <ImagePlaceholder className="absolute inset-0" />
        )}

        {comingSoon && <StatusPill>Próximamente</StatusPill>}
        {outOfStock && <StatusPill>Sin stock</StatusPill>}
      </div>

      <div className="pt-3 space-y-1">
        {categoryName && (
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {categoryName}
          </p>
        )}

        <h3
          className={cn(
            "text-sm font-medium leading-5 line-clamp-2 transition-colors",
            interactive && "group-hover:text-primary"
          )}
        >
          {product.name}
        </h3>

        {!comingSoon && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span
                className={cn(
                  "text-base font-semibold",
                  priceInfo.hasDiscount && "text-primary"
                )}
              >
                {formatCurrency(priceInfo.final)}
              </span>
              {priceInfo.hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(priceInfo.original)}
                </span>
              )}
            </div>
            {priceInfo.hasDiscount && priceInfo.description && (
              <p className="text-[11px] text-primary/90 line-clamp-1">
                {priceInfo.description}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="group relative flex flex-col">
      {interactive ? (
        <Link href={`/tienda/${product.slug}`} className="block">
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}

      {/* Hermano del Link (no anidado) para no meter un botón adentro de un <a>. */}
      {interactive && (
        <AddToCartButton
          product={product}
          variant="icon"
          className="absolute top-2 right-2 z-10"
        />
      )}
    </div>
  );
}
