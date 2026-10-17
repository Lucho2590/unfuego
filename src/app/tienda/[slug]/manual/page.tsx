import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { getProductBySlug } from "@/lib/firebase/products";
import { getManualFilePath } from "@/lib/utils";
import { PdfViewer } from "@/components/tienda/PdfViewer";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product?.manualUrl) {
    return { title: "Manual no encontrado | Un Fuego" };
  }

  return {
    title: `Manual de ${product.name} | Un Fuego`,
    description: `Instructivo de armado de ${product.name}.`,
    robots: { index: false },
  };
}

export const revalidate = 3600;

/**
 * Vista previa del manual (PDF) dentro de la tienda, sin descargarlo. Esta es la URL pensada
 * para el QR que va con el producto: /tienda/{slug}/manual. Se permite también para los
 * productos "Próximamente" (la ficha es 404, pero el manual puede ser útil igual).
 */
export default async function ProductManualPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product?.manualUrl) {
    notFound();
  }

  const productHref = product.comingSoon ? "/tienda" : `/tienda/${product.slug}`;

  return (
    <>
      <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 md:flex-1">
              <Link
                href={productHref}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {product.comingSoon ? "Volver a la tienda" : "Volver al producto"}
              </Link>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Manual de armado
              </p>
              <h1 className="text-xl md:text-2xl font-light tracking-tight truncate">
                {product.name}
              </h1>
            </div>

            <Button asChild variant="outline" size="sm" className="self-start md:self-auto">
              <a href={product.manualUrl} target="_blank" rel="noopener noreferrer">
                <FileDown />
                Descargar PDF
              </a>
            </Button>
          </div>

          <PdfViewer
            url={getManualFilePath(product.slug, product.manualUrl)}
            downloadUrl={product.manualUrl}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
