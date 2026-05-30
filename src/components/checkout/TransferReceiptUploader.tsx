"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFile, getTransferProofPath } from "@/lib/firebase/storage";

interface Props {
  orderId: string;
  /** Token de acceso (del link del email) que habilita la subida. */
  token: string;
  /** Se invoca tras subir con éxito (para que el tracker actualice la timeline). */
  onUploaded?: () => void;
}

const MAX_MB = 10;

export function TransferReceiptUploader({ orderId, token, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera los ${MAX_MB}MB`);
      return;
    }

    setUploading(true);
    try {
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

      toast.success("Comprobante recibido. Lo estamos revisando.");
      onUploaded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el comprobante");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <Button asChild disabled={uploading} className="w-full cursor-pointer">
          <span>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" /> Subir comprobante
              </>
            )}
          </span>
        </Button>
      </label>
      <p className="text-xs text-muted-foreground text-center">
        Imagen o PDF, hasta {MAX_MB}MB.
      </p>
    </div>
  );
}
