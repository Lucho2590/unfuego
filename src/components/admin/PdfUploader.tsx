"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText, Images, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  uploadFile,
  getProductManualPath,
  getProductManualPagePath,
  IMMUTABLE_CACHE,
} from "@/lib/firebase/storage";
import { renderPdfPages } from "@/lib/pdf/render-pages";

interface PdfUploaderProps {
  productId: string;
  manualUrl: string;
  /** Páginas pre-renderizadas (URLs). Vacío = la tienda muestra el PDF con pdf.js (lento). */
  manualPages: string[];
  onChange: (url: string) => void;
  onPagesChange: (pages: string[]) => void;
}

export function PdfUploader({
  productId,
  manualUrl,
  manualPages,
  onChange,
  onPagesChange,
}: PdfUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [pagesStatus, setPagesStatus] = useState<string | null>(null);

  /**
   * Renderiza el PDF a imágenes y las sube a Storage. Se hace en el navegador del admin una
   * sola vez; la tienda después muestra las imágenes (livianas) en vez del PDF entero.
   */
  const generatePages = useCallback(
    async (data: ArrayBuffer) => {
      setPagesStatus("Renderizando páginas…");
      try {
        const blobs = await renderPdfPages(data, (done, total) =>
          setPagesStatus(`Renderizando página ${done} de ${total}…`)
        );
        const stamp = Date.now();
        const urls: string[] = [];
        for (let i = 0; i < blobs.length; i++) {
          setPagesStatus(`Subiendo página ${i + 1} de ${blobs.length}…`);
          const path = getProductManualPagePath(productId, stamp, i + 1);
          const file = new File([blobs[i]], `page-${i + 1}.webp`, { type: "image/webp" });
          urls.push(await uploadFile(file, path, { ...IMMUTABLE_CACHE, contentType: "image/webp" }));
        }
        onPagesChange(urls);
        toast.success(`Vista previa lista (${urls.length} página${urls.length === 1 ? "" : "s"})`);
      } catch (error) {
        console.error("Manual pages error:", error);
        toast.error("No se pudo generar la vista previa. La tienda mostrará el PDF directo.");
      } finally {
        setPagesStatus(null);
      }
    },
    [productId, onPagesChange]
  );

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const path = getProductManualPath(productId, `${Date.now()}-${file.name}`);
        const url = await uploadFile(file, path);
        onChange(url);
        setUploading(false);
        // Tiene que ir DESPUÉS de onChange: el form limpia las páginas al cambiar el PDF.
        await generatePages(await file.arrayBuffer());
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("No se pudo subir el PDF");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [productId, onChange, generatePages]
  );

  // Para manuales subidos antes de que existiera la vista previa: se baja el PDF por el proxy
  // del admin (Storage no manda CORS) y se renderiza igual que uno recién subido.
  const regenerate = useCallback(async () => {
    setPagesStatus("Descargando PDF…");
    try {
      const res = await fetch(`/api/admin/products/manual-file?url=${encodeURIComponent(manualUrl)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await generatePages(await res.arrayBuffer());
    } catch (error) {
      console.error("Manual download error:", error);
      toast.error("No se pudo descargar el PDF para generar la vista previa");
      setPagesStatus(null);
    }
  }, [manualUrl, generatePages]);

  const busy = uploading || pagesStatus !== null;

  return (
    <div className="space-y-3">
      {manualUrl && (
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-primary hover:underline"
          >
            Ver manual (PDF)
          </a>
          <button
            type="button"
            onClick={() => {
              onChange("");
              onPagesChange([]);
            }}
            disabled={busy}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Eliminar manual"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {manualUrl && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {pagesStatus ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {pagesStatus}
            </span>
          ) : manualPages.length > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5" />
              Vista previa: {manualPages.length} página{manualPages.length === 1 ? "" : "s"}
            </span>
          ) : (
            <span>Sin vista previa: en la tienda se carga el PDF entero (lento en celulares).</span>
          )}
          {!pagesStatus && (
            <button
              type="button"
              onClick={regenerate}
              disabled={busy}
              className="text-primary hover:underline disabled:opacity-50"
            >
              {manualPages.length > 0 ? "Regenerar" : "Generar vista previa"}
            </button>
          )}
        </div>
      )}

      <label className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors">
        <Upload className="w-4 h-4" />
        <span>
          {uploading
            ? "Subiendo..."
            : manualUrl
              ? "Reemplazar PDF"
              : "Subir PDF"}
        </span>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="hidden"
          disabled={busy}
        />
      </label>
    </div>
  );
}
