"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileText, X, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFile, getTransferProofPath } from "@/lib/firebase/storage";

interface Props {
  orderId: string;
  /** Token de acceso (del link del email) que habilita la subida. */
  token: string;
  /** Se invoca tras subir con éxito (para que el tracker actualice la timeline). */
  onUploaded?: () => void;
  /** Modo simulación (page de test): no sube ni llama a la API, solo simula el éxito. */
  simulate?: boolean;
}

const MAX_MB = 10;

export function TransferReceiptUploader({
  orderId,
  token,
  onUploaded,
  simulate,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (selected: File | undefined) => {
    if (!selected) return;
    if (selected.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera los ${MAX_MB}MB`);
      return;
    }
    const isValid =
      selected.type.startsWith("image/") || selected.type === "application/pdf";
    if (!isValid) {
      toast.error("Subí una imagen o un PDF");
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleSend = async () => {
    if (!file) return;
    setUploading(true);
    try {
      if (simulate) {
        await new Promise((r) => setTimeout(r, 600));
        toast.success("Comprobante enviado (simulación).");
        onUploaded?.();
        return;
      }

      const path = getTransferProofPath(orderId, `${Date.now()}-${file.name}`);
      const url = await uploadFile(file, path);

      const res = await fetch(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptUrl: url, token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al adjuntar el comprobante");
      }

      toast.success("Comprobante enviado. Lo estamos revisando.");
      onUploaded?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al enviar el comprobante"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="hidden"
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm">
            Arrastrá el comprobante o{" "}
            <span className="text-primary font-medium">elegí un archivo</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Imagen o PDF, hasta {MAX_MB}MB.
          </span>
        </button>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button onClick={handleSend} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> Enviar comprobante
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
