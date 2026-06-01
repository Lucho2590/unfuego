import { ProductForm } from "@/components/admin/ProductForm";
import { getAllSections } from "@/lib/firebase/sections";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const sections = await getAllSections();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-light">Nuevo producto</h1>
      <ProductForm sections={sections} />
    </div>
  );
}
