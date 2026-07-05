"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText } from "lucide-react";
import { uploadFile, getProductManualPath } from "@/lib/firebase/storage";

interface PdfUploaderProps {
  productId: string;
  manualUrl: string;
  onChange: (url: string) => void;
}

export function PdfUploader({ productId, manualUrl, onChange }: PdfUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const path = getProductManualPath(productId, `${Date.now()}-${file.name}`);
        const url = await uploadFile(file, path);
        onChange(url);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [productId, onChange]
  );

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
            onClick={() => onChange("")}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Eliminar manual"
          >
            <X className="w-4 h-4" />
          </button>
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
          disabled={uploading}
        />
      </label>
    </div>
  );
}
