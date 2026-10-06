"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Reorder } from "framer-motion";
import { Upload, X, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  uploadFileWithProgress,
  getProductImagePath,
  IMMUTABLE_CACHE,
} from "@/lib/firebase/storage";
import { compressQueued } from "@/lib/images/compress";

/** Una foto de cámara puede pesar 15 MB tranquilamente; más que esto es un archivo raro. */
const MAX_MB = 25;

interface ImageUploaderProps {
  productId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

/** Una imagen elegida por el usuario que todavía no terminó de subir (o que falló). */
interface PendingUpload {
  id: string;
  file: File;
  /** `blob:` local, para mostrar la miniatura al instante sin esperar a Storage. */
  previewUrl: string;
  progress: number;
  /** "processing" = comprimiendo en el browser, todavía no empezó a subir. */
  status: "processing" | "uploading" | "error";
}

export function ImageUploader({
  productId,
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const [pending, setPending] = useState<PendingUpload[]>([]);

  // Las subidas terminan de forma asincrónica: leemos el array actual desde una ref para no
  // pisar reordenamientos o borrados que el usuario haya hecho mientras subía.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // Liberar los blobs locales que hayan quedado vivos al desmontar.
  useEffect(() => {
    return () => {
      for (const item of pendingRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  const isBusy = pending.some((item) => item.status !== "error");

  const runUpload = useCallback(
    async (item: PendingUpload): Promise<string | null> => {
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "processing", progress: 0 } : p
        )
      );

      // Se achica y se pasa a WebP acá, en el browser: si subiéramos el JPEG crudo de la
      // cámara (3-12 MB), después el optimizer tendría que bajar ese archivo entero de
      // Storage en cada transformación. Si la compresión falla devuelve el original.
      const { file: toUpload } = await compressQueued(item.file);

      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "uploading", progress: 0 } : p
        )
      );

      const path = getProductImagePath(
        productId,
        `${Date.now()}-${toUpload.name}`
      );

      try {
        const url = await uploadFileWithProgress(
          toUpload,
          path,
          (progress) =>
            setPending((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, progress } : p))
            ),
          { ...IMMUTABLE_CACHE, contentType: toUpload.type }
        );
        setPending((prev) => prev.filter((p) => p.id !== item.id));
        URL.revokeObjectURL(item.previewUrl);
        return url;
      } catch (error) {
        console.error("Upload error:", error);
        setPending((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "error" } : p))
        );
        toast.error(`No se pudo subir "${item.file.name}"`);
        return null;
      }
    },
    [productId]
  );

  /** Agrega URLs al final, descartando las que ya estén (evita keys duplicadas al reordenar). */
  const appendUrls = useCallback(
    (urls: string[]) => {
      const current = imagesRef.current;
      const nuevas = urls.filter(
        (url, index) => !current.includes(url) && urls.indexOf(url) === index
      );
      if (nuevas.length > 0) onImagesChange([...current, ...nuevas]);
    },
    [onImagesChange]
  );

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (files.length === 0) return;

      // HEIC no lo puede decodificar ningún browser ni el optimizer: si lo dejáramos pasar,
      // la compresión falla, se sube el original y queda una imagen que no se ve en la tienda.
      const validos = files.filter(
        (file) =>
          file.type.startsWith("image/") &&
          !/heic|heif/i.test(file.type) &&
          file.size <= MAX_MB * 1024 * 1024
      );
      const rechazados = files.length - validos.length;
      if (rechazados > 0) {
        toast.error(
          `No se pudieron agregar ${rechazados} archivo(s): tienen que ser imágenes ` +
            `JPG, PNG o WebP de hasta ${MAX_MB}MB. Si son fotos de iPhone en HEIC, cambiá ` +
            `Ajustes > Cámara > Formatos a "Más compatible".`
        );
      }
      if (validos.length === 0) return;

      const items: PendingUpload[] = validos.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "processing",
      }));
      setPending((prev) => [...prev, ...items]);

      // En paralelo para que se vean avanzar todas, pero se agregan al final en el orden
      // en que se eligieron y con una sola llamada, así no se pisan entre sí.
      const results = await Promise.all(items.map(runUpload));
      appendUrls(results.filter((url): url is string => url !== null));
    },
    [runUpload, appendUrls]
  );

  const retryUpload = useCallback(
    async (item: PendingUpload) => {
      const url = await runUpload(item);
      if (url) appendUrls([url]);
    },
    [runUpload, appendUrls]
  );

  const dismissUpload = useCallback((item: PendingUpload) => {
    setPending((prev) => prev.filter((p) => p.id !== item.id));
    URL.revokeObjectURL(item.previewUrl);
  }, []);

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 overflow-x-auto pb-1">
        <Reorder.Group
          axis="x"
          values={images}
          onReorder={onImagesChange}
          className="flex gap-3 list-none m-0 p-0"
        >
          {images.map((url, index) => (
            <Reorder.Item
              key={url}
              value={url}
              className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden border border-border bg-product-surface group cursor-grab active:cursor-grabbing"
            >
              <Image
                src={url}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-contain p-1 pointer-events-none select-none"
                sizes="96px"
                draggable={false}
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] leading-none">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Eliminar imagen ${index + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {pending.map((item) =>
          item.status !== "error" ? (
            <div
              key={item.id}
              className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden border border-border bg-product-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="absolute inset-0 w-full h-full object-contain p-1 opacity-30"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/40">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {/* Comprimir no tiene progreso medible: solo el spinner y el cartel. */}
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {item.status === "processing" ? "Optimizando" : `${item.progress}%`}
                </span>
              </div>
              {item.status === "uploading" && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-primary transition-[width] duration-200"
                  style={{ width: `${item.progress}%` }}
                />
              )}
            </div>
          ) : (
            <div
              key={item.id}
              className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden border border-red-500/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="absolute inset-0 w-full h-full object-contain p-1 opacity-20"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/60 px-1 text-center">
                <span className="text-[10px] text-red-500 leading-tight">
                  Falló
                </span>
                <button
                  type="button"
                  onClick={() => retryUpload(item)}
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reintentar
                </button>
              </div>
              <button
                type="button"
                onClick={() => dismissUpload(item)}
                className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full"
                aria-label={`Descartar ${item.file.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        )}

        <label
          className={`w-24 h-24 shrink-0 rounded-md border border-dashed border-border flex flex-col items-center justify-center transition-colors ${
            isBusy
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-primary/50"
          }`}
        >
          {isBusy ? (
            <Loader2 className="w-5 h-5 text-muted-foreground mb-1 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-muted-foreground mb-1" />
          )}
          <span className="text-xs text-muted-foreground">
            {isBusy ? "Procesando" : "Subir"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={isBusy}
          />
        </label>
      </div>

      {images.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Arrastrá las imágenes para reordenarlas. La primera es la que se ve en
          la tienda.
        </p>
      )}
    </div>
  );
}
