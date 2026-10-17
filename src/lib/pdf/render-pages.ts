// Renderiza las páginas de un PDF a imágenes WebP EN EL NAVEGADOR (admin), para que la vista
// previa en la tienda muestre imágenes livianas en vez de hacer que el celular baje el PDF
// entero (hay manuales de más de 100 MB).

/** Ancho en px de cada página renderizada. El visor topea en 900px CSS (~1400 a DPR 1.5). */
const PAGE_WIDTH = 1400;
const QUALITY = 0.8;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob falló"))), type, quality)
  );
}

/**
 * Devuelve un Blob por página, en orden. `onProgress(done, total)` se llama al terminar cada
 * una. Carga pdf.js bajo demanda (solo el admin lo paga).
 */
export async function renderPdfPages(
  data: ArrayBuffer,
  onProgress?: (done: number, total: number) => void
): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  const blobs: Blob[] = [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: PAGE_WIDTH / base.width });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      // Fondo blanco: las páginas con transparencia saldrían negras en WebP sin alfa.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      blobs.push(await canvasToBlob(canvas, "image/webp", QUALITY));
      page.cleanup();
      onProgress?.(n, doc.numPages);
    }
  } finally {
    await task.destroy();
  }
  return blobs;
}
