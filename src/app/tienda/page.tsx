import type { Metadata } from "next";
import { getProducts } from "@/lib/firebase/products";
import { ProductGrid } from "@/components/tienda/ProductGrid";

export const metadata: Metadata = {
  title: "Tienda | Un Fuego",
  description:
    "Productos de cocina outdoor pensados para acompañarte en cualquier lugar.",
};

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  const products = await getProducts();

  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-display-md font-light tracking-tight mb-3">
            Tienda
          </h1>
          <p className="text-muted-foreground">
            Objetos simples, resistentes y pensados para moverse.
          </p>
        </div>

        <ProductGrid products={products} />
      </div>
    </div>
  );
}
