import { cache } from "react";
import { unstable_cache } from "next/cache";
import { fsGet, fsQuery } from "./admin";
import type { Product } from "../types";

// Orden de exposición: sortOrder ascendente (menor primero); los productos sin
// sortOrder quedan al final, desempatados por createdAt descendente (más nuevo
// primero, preservando el comportamiento previo). Se ordena en memoria para no
// depender de índices compuestos ni perder docs sin el campo en el orderBy de Firestore.
function bySortOrder(a: Product, b: Product): number {
  // "Próximamente" siempre al final, sin importar su sortOrder.
  const ac = a.comingSoon ? 1 : 0;
  const bc = b.comingSoon ? 1 : 0;
  if (ac !== bc) return ac - bc;

  const ao = a.sortOrder ?? Infinity;
  const bo = b.sortOrder ?? Infinity;
  if (ao !== bo) return ao - bo;
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

// Lecturas públicas (storefront) cacheadas en el Data Cache de Next, etiquetadas
// con "products" para invalidarlas al instante desde el admin (revalidateTag).
// El revalidate de 1h es solo red de seguridad. Las lecturas del admin más abajo
// quedan sin cachear para que el panel siempre vea datos frescos.
export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const docs = await fsQuery(
      "products",
      [{ field: "isActive", op: "EQUAL", value: true }]
    );
    return (docs as unknown as Product[]).sort(bySortOrder);
  },
  ["products-active"],
  { tags: ["products"], revalidate: 3600 }
);

// React cache() deduplica el doble llamado (generateMetadata + render) dentro del
// mismo request; unstable_cache persiste el resultado entre requests por slug.
export const getProductBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Product | null> => {
      const docs = await fsQuery(
        "products",
        [
          { field: "slug", op: "EQUAL", value: slug },
          { field: "isActive", op: "EQUAL", value: true },
        ],
        undefined,
        1
      );
      return (docs[0] as unknown as Product) ?? null;
    },
    ["product-by-slug"],
    { tags: ["products"], revalidate: 3600 }
  )
);

export async function getProductById(id: string): Promise<Product | null> {
  const doc = await fsGet("products", id);
  return (doc as unknown as Product) ?? null;
}

export async function getAllProducts(): Promise<Product[]> {
  const docs = await fsQuery("products");
  return (docs as unknown as Product[]).sort(bySortOrder);
}
