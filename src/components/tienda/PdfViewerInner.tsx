"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

// El worker tiene que configurarse en el MISMO módulo que usa <Document>, si no react-pdf lo
// pisa con su default (ver README de react-pdf). `pdfjs-dist` está como dependencia directa
// con la misma versión que usa react-pdf para que `import.meta.url` lo resuelva.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Ancho máximo de una página: más que esto a 1x queda pixelado en pantallas comunes y el
// canvas crece al cuadrado en memoria (importa en celulares).
const MAX_PAGE_WIDTH = 900;

interface PdfViewerInnerProps {
  url: string;
  /** Qué mostrar si el PDF no se puede cargar. */
  error: React.ReactNode;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default function PdfViewerInner({ url, error }: PdfViewerInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  const [numPages, setNumPages] = useState<number>();

  // Las páginas se renderizan al ancho real del contenedor (y se re-renderizan si cambia:
  // rotar el teléfono, achicar la ventana).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.min(el.clientWidth, MAX_PAGE_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <Centered>
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando manual…
          </Centered>
        }
        error={error}
        className="flex flex-col items-center gap-4"
      >
        {width &&
          numPages &&
          Array.from({ length: numPages }, (_, index) => (
            <Page
              key={index}
              pageNumber={index + 1}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="overflow-hidden rounded-md shadow-lg"
              loading={
                <div
                  className="animate-pulse rounded-md bg-muted"
                  style={{ width, height: width * 1.414 }}
                />
              }
            />
          ))}
      </Document>
    </div>
  );
}
