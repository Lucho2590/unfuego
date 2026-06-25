import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/firebase/products";
import { ProductDetail } from "@/components/tienda/ProductDetail";
import { ProductViewTracker } from "@/components/tienda/ProductViewTracker";
import { Footer } from "@/components/layout/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.comingSoon) {
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

export const revalidate = 3600;

// Pre-renderiza las fichas de productos activos (excluye "Próximamente", que no
// tienen ficha accesible). dynamicParams queda en su default (true): un producto
// nuevo aún no listado se sirve on-demand igual.
export async function generateStaticParams() {
  const products = await getProducts();
  return products
    .filter((product) => !product.comingSoon)
    .map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Los productos "Próximamente" se listan en la tienda pero no tienen ficha:
  // entrar directo a su URL devuelve 404.
  if (!product || product.comingSoon) {
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
