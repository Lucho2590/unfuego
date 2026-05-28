import { notFound } from "next/navigation";
import { getProductById } from "@/lib/firebase/products";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-light">Editar producto</h1>
      <ProductForm product={product} />
    </div>
  );
}
