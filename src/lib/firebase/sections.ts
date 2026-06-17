import { unstable_cache } from "next/cache";
import { fsGet, fsQuery } from "./admin";
import type { Section } from "../types";

// Mismo criterio que productos: sortOrder ascendente (menor primero), los que no
// tienen sortOrder quedan al final desempatados por createdAt descendente. Se ordena
// en memoria para no depender de índices compuestos en Firestore.
function bySortOrder(a: Section, b: Section): number {
  const ao = a.sortOrder ?? Infinity;
  const bo = b.sortOrder ?? Infinity;
  if (ao !== bo) return ao - bo;
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

/** Secciones activas, ordenadas (tienda y selector de producto). Cacheadas en el
 * Data Cache de Next, etiquetadas con "sections" para invalidarlas desde el admin. */
export const getSections = unstable_cache(
  async (): Promise<Section[]> => {
    const docs = await fsQuery(
      "sections",
      [{ field: "isActive", op: "EQUAL", value: true }]
    );
    return (docs as unknown as Section[]).sort(bySortOrder);
  },
  ["sections-active"],
  { tags: ["sections"], revalidate: 3600 }
);

/** Todas las secciones, ordenadas (admin). */
export async function getAllSections(): Promise<Section[]> {
  const docs = await fsQuery("sections");
  return (docs as unknown as Section[]).sort(bySortOrder);
}

export async function getSectionById(id: string): Promise<Section | null> {
  const doc = await fsGet("sections", id);
  return (doc as unknown as Section) ?? null;
}
