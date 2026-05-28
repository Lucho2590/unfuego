import { ProductForm } from "@/components/admin/ProductForm";

export default function NuevoProductoPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-light">Nuevo producto</h1>
      <ProductForm />
    </div>
  );
}
