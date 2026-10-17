import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * La llama que se muestra cuando un producto no tiene foto (típicamente los "Próximamente").
 * Es el viejo `placeholder.jpg` (1667px, 732 KB) rebajado a 800px en WebP (~2 KB): a 48px en
 * el checkout o a 270px en la grilla no se nota la diferencia y casi no pesa.
 */
export function ImagePlaceholder({
  className,
  sizes = "(min-width: 768px) 33vw, 50vw",
}: {
  className?: string;
  /** Mismo `sizes` que recibiría la foto real en ese lugar (default: tamaño de card). */
  sizes?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-product-surface", className)} aria-hidden>
      <Image
        src="/images/placeholder.webp"
        alt=""
        fill
        className="object-cover"
        sizes={sizes}
      />
    </div>
  );
}
