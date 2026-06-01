"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductImageLightbox } from "./ProductImageLightbox";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-6xl">🔥</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden cursor-zoom-in"
        aria-label={`Ampliar imagen de ${productName}`}
      >
        <Image
          src={images[selectedIndex]}
          alt={`${productName} - imagen ${selectedIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
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
                "relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors",
                index === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={image}
                alt={`${productName} - miniatura ${index + 1}`}
                fill
                className="object-cover"
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
