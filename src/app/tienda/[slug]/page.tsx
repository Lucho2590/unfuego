import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/firebase/products";
import { ProductDetail } from "@/components/tienda/ProductDetail";
import { ProductViewTracker } from "@/components/tienda/ProductViewTracker";
import { Footer } from "@/components/layout/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado | Un Fuego" };
  }

  return {
    title: `${product.name} | Un Fuego`,
    description: product.shortDescription || product.description,
    openGraph: {
      title: `${product.name} | Un Fuego`,
      description: product.shortDescription || product.description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductViewTracker productId={product.id} slug={product.slug} />
      <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
        <div className="max-w-5xl mx-auto">
          <ProductDetail product={product} />
        </div>
      </div>
      <Footer />
    </>
  );
}
