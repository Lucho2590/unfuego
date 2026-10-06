"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImagePlaceholder } from "@/components/common/ImagePlaceholder";
import { ProductImageLightbox } from "./ProductImageLightbox";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

// La galería ocupa media columna de un `max-w-5xl`, así que arriba de 1152px nunca pasa de
// 488px. El `50vw` de antes hacía pedir variantes del doble de lo necesario.
const GALLERY_SIZES =
  "(min-width: 1152px) 488px, (min-width: 1024px) calc(50vw - 88px), (min-width: 768px) calc(50vw - 80px), calc(100vw - 48px)";

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return <ImagePlaceholder className="aspect-square w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative aspect-square w-full bg-product-surface rounded-lg overflow-hidden cursor-zoom-in"
        aria-label={`Ampliar imagen de ${productName}`}
      >
        {/* `object-contain`: la foto se ve entera, sin recortar los bordes. El padding va en
            el <img> — con border-box achica la content box que `contain` usa de referencia. */}
        <Image
          src={images[selectedIndex]}
          alt={`${productName} - imagen ${selectedIndex + 1}`}
          fill
          className="object-contain p-4"
          sizes={GALLERY_SIZES}
          priority
        />
      </button>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors bg-product-surface",
                index === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={image}
                alt={`${productName} - miniatura ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      <ProductImageLightbox
        images={images}
        productName={productName}
        index={selectedIndex}
        onIndexChange={setSelectedIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
