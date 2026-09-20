import { ProductForm } from "@/components/admin/ProductForm";
import { getAllSections } from "@/lib/firebase/sections";
import { getTransferSettings } from "@/lib/transfer/settings";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const [sections, transfer] = await Promise.all([
    getAllSections(),
    getTransferSettings(),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-light">Nuevo producto</h1>
      <ProductForm
        sections={sections}
        transferDiscountPercent={transfer.discountPercent}
      />
    </div>
  );
}
