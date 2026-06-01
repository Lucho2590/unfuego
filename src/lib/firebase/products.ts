import { fsGet, fsQuery } from "./admin";
import type { Product } from "../types";

// Orden de exposición: sortOrder ascendente (menor primero); los productos sin
// sortOrder quedan al final, desempatados por createdAt descendente (más nuevo
// primero, preservando el comportamiento previo). Se ordena en memoria para no
// depender de índices compuestos ni perder docs sin el campo en el orderBy de Firestore.
function bySortOrder(a: Product, b: Product): number {
  const ao = a.sortOrder ?? Infinity;
  const bo = b.sortOrder ?? Infinity;
  if (ao !== bo) return ao - bo;
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

export async function getProducts(): Promise<Product[]> {
  const docs = await fsQuery(
    "products",
    [{ field: "isActive", op: "EQUAL", value: true }]
  );
  return (docs as unknown as Product[]).sort(bySortOrder);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
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
}

export async function getProductById(id: string): Promise<Product | null> {
  const doc = await fsGet("products", id);
  return (doc as unknown as Product) ?? null;
}

export async function getAllProducts(): Promise<Product[]> {
  const docs = await fsQuery("products");
  return (docs as unknown as Product[]).sort(bySortOrder);
}
