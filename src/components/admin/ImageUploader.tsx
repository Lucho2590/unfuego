"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { uploadImage, getProductImagePath } from "@/lib/firebase/storage";

interface ImageUploaderProps {
  productId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageUploader({
  productId,
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        const newUrls: string[] = [];
        for (const file of Array.from(files)) {
          const path = getProductImagePath(productId, `${Date.now()}-${file.name}`);
          const url = await uploadImage(file, path);
          newUrls.push(url);
        }
        onImagesChange([...images, ...newUrls]);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [productId, images, onImagesChange]
  );

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div
            key={index}
            className="relative w-24 h-24 rounded-md overflow-hidden border border-border group"
          >
            <Image
              src={url}
              alt={`Imagen ${index + 1}`}
              fill
              className="object-cover"
              sizes="96px"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <label className="w-24 h-24 rounded-md border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">
            {uploading ? "..." : "Subir"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
