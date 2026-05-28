import { fsGet, fsQuery } from "./admin";
import type { Product } from "../types";

export async function getProducts(): Promise<Product[]> {
  const docs = await fsQuery(
    "products",
    [{ field: "isActive", op: "EQUAL", value: true }],
    { field: "createdAt", direction: "DESCENDING" }
  );
  return docs as unknown as Product[];
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
  const docs = await fsQuery(
    "products",
    undefined,
    { field: "createdAt", direction: "DESCENDING" }
  );
  return docs as unknown as Product[];
}
