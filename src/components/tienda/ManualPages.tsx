import Image from "next/image";

// El contenedor es un `max-w-5xl` con padding lateral; las páginas topean en 900px.
const PAGE_SIZES = "(min-width: 948px) 900px, calc(100vw - 48px)";

interface ManualPagesProps {
  pages: string[];
  productName: string;
}

/**
 * Vista previa del manual con las páginas ya renderizadas como imágenes (ver PdfUploader).
 * Pasan por el optimizer de Next, así el celular recibe cada página al ancho de su pantalla
 * en AVIF/WebP en vez de bajar el PDF original.
 */
export function ManualPages({ pages, productName }: ManualPagesProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {pages.map((src, index) => (
        <div
          key={src}
          className="relative w-full max-w-[900px] overflow-hidden rounded-md bg-white shadow-lg"
        >
          <Image
            src={src}
            alt={`${productName} - manual, página ${index + 1}`}
            width={1400}
            height={1980}
            sizes={PAGE_SIZES}
            className="h-auto w-full"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
