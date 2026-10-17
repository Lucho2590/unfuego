"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// pdf.js solo corre en el browser (usa canvas y un Web Worker), así que el visor se carga sin
// SSR y en un chunk aparte: la ficha del producto no paga el peso de pdf.js, solo esta página.
const PdfViewerInner = dynamic(() => import("./PdfViewerInner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      Cargando visor…
    </div>
  ),
});

function DownloadFallback({ downloadUrl }: { downloadUrl: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-sm text-muted-foreground">
      <p>No se pudo mostrar el manual en el navegador.</p>
      <Button asChild variant="outline" size="sm">
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <FileDown />
          Descargar PDF
        </a>
      </Button>
    </div>
  );
}

// Si pdf.js explota fuera del flujo que react-pdf maneja (p. ej. un fetch que falla dentro
// del worker), que no se caiga toda la página: se muestra el fallback con la descarga.
class PdfErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface PdfViewerProps {
  /** URL del PDF que lee pdf.js (misma origin: el proxy de /api/products/[slug]/manual). */
  url: string;
  /** URL del botón de descarga en el fallback (la original de Storage). */
  downloadUrl: string;
}

export function PdfViewer({ url, downloadUrl }: PdfViewerProps) {
  const fallback = <DownloadFallback downloadUrl={downloadUrl} />;
  return (
    <PdfErrorBoundary fallback={fallback}>
      <PdfViewerInner url={url} error={fallback} />
    </PdfErrorBoundary>
  );
}
