"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImageLightboxProps {
  images: string[];
  productName: string;
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SWIPE_THRESHOLD = 50; // px mínimos para contar como swipe

export function ProductImageLightbox({
  images,
  productName,
  index,
  onIndexChange,
  open,
  onOpenChange,
}: ProductImageLightboxProps) {
  const hasMultiple = images.length > 1;
  const touchStartX = useRef<number | null>(null);

  const goPrev = () =>
    onIndexChange((index - 1 + images.length) % images.length);
  const goNext = () => onIndexChange((index + 1) % images.length);

  // Navegación con teclado (Escape lo maneja radix Dialog).
  useEffect(() => {
    if (!open || !hasMultiple) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasMultiple, index, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  if (images.length === 0) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Dialog.Title className="sr-only">
            {productName} — imagen {index + 1} de {images.length}
          </Dialog.Title>

          <div className="relative h-full w-full max-h-[90vh] max-w-5xl mx-auto p-4">
            <Image
              key={index}
              src={images[index]}
              alt={`${productName} - imagen ${index + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="size-6" />
            </Button>
          </Dialog.Close>

          {hasMultiple && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 hover:text-white"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="size-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 hover:text-white"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="size-8" />
              </Button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                {index + 1} / {images.length}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
