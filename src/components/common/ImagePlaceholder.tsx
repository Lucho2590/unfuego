import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marco vacío para cuando un producto no tiene foto. Reemplaza al viejo `placeholder.jpg`
 * (732 KB, que se bajaba incluso para mostrarlo a 48px): esto no pide un solo byte de red,
 * el icono va dentro del bundle que ya se descarga.
 */
export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        className
      )}
      aria-hidden
    >
      <ImageOff className="w-1/4 h-1/4 max-w-8 max-h-8 opacity-50" />
    </div>
  );
}
