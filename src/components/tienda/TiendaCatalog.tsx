"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "./ProductGrid";
import type { Product, Section } from "@/lib/types";

interface TiendaCatalogProps {
  products: Product[];
  sections: Section[];
}

export function TiendaCatalog({ products, sections }: TiendaCatalogProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Solo mostramos chips de secciones que tengan al menos un producto.
  const sectionsWithProducts = useMemo(() => {
    const used = new Set(products.map((p) => p.category));
    return sections.filter((s) => used.has(s.id));
  }, [products, sections]);

  const filtered = useMemo(
    () =>
      selected === null
        ? products
        : products.filter((p) => p.category === selected),
    [products, selected]
  );

  return (
    <div className="space-y-8">
      {sectionsWithProducts.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={selected === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelected(null)}
            className="rounded-full"
          >
            Todos
          </Button>
          {sectionsWithProducts.map((section) => (
            <Button
              key={section.id}
              variant={selected === section.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelected(section.id)}
              className="rounded-full"
            >
              {section.name}
            </Button>
          ))}
        </div>
      )}

      <ProductGrid products={filtered} />
    </div>
  );
}
