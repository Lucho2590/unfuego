import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  /** Mapa `section.id` → nombre, para mostrar la categoría en cada card. */
  categoryNames?: Record<string, string>;
}

export const PRODUCT_GRID_CLASS =
  "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-4 lg:gap-6";

export function ProductGrid({ products, categoryNames = {} }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">
          Próximamente nuevos productos
        </p>
      </div>
    );
  }

  return (
    <div className={PRODUCT_GRID_CLASS}>
      {/* Las primeras cuatro son la primera fila en desktop (y las dos primeras en mobile):
          sin `priority` el LCP de la tienda se descarga recién después del layout. */}
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryName={categoryNames[product.category]}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
