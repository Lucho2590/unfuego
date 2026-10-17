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

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  // Solo mostramos chips de secciones que tengan al menos un producto.
  const sectionsWithProducts = useMemo(
    () => sections.filter((s) => (countByCategory.get(s.id) ?? 0) > 0),
    [sections, countByCategory]
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s.name])),
    [sections]
  );

  const filtered = useMemo(
    () =>
      selected === null
        ? products
        : products.filter((p) => p.category === selected),
    [products, selected]
  );

  const chips = [
    { id: null, label: "Todos", count: products.length },
    ...sectionsWithProducts.map((s) => ({
      id: s.id,
      label: s.name,
      count: countByCategory.get(s.id) ?? 0,
    })),
  ];

  return (
    <div className="space-y-6">
      {sectionsWithProducts.length > 0 && (
        <div className="space-y-3">
          {/* Mobile: una sola fila scrolleable que sangra hasta el borde de la pantalla.
              Desktop: chips centrados y con wrap. */}
          <div className="-mx-[var(--section-padding-x)] flex gap-2 overflow-x-auto px-[var(--section-padding-x)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
            {chips.map((chip) => {
              const active = selected === chip.id;
              return (
                <Button
                  key={chip.id ?? "all"}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelected(chip.id)}
                  aria-pressed={active}
                  className="shrink-0 rounded-full"
                >
                  {chip.label}
                  <span
                    className={
                      active ? "text-primary-foreground/70" : "text-muted-foreground"
                    }
                  >
                    {chip.count}
                  </span>
                </Button>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            {filtered.length === 1
              ? "1 producto"
              : `${filtered.length} productos`}
          </p>
        </div>
      )}

      <ProductGrid products={filtered} categoryNames={categoryNames} />
    </div>
  );
}
