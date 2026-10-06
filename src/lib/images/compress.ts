// Compresión de imágenes EN EL NAVEGADOR, antes de subirlas a Storage.
//
// La cámara de un celular tira JPEGs de ~4000px y 3-12 MB. Ese peso después se paga en cada
// transformación del optimizer de Next (que tiene que bajar el archivo entero de Storage), y es
// la causa principal de que la tienda cargue lento. Achicar en origen lo arregla de raíz.

/** Lado máximo del resultado. El consumo más grande es el lightbox (992px CSS, ~1080 a DPR 2). */
const MAX_SIDE = 1600;
/** El optimizer de Next después re-codifica a q70/75: bajar más acá solo acumula pérdida. */
const QUALITY = 0.82;
/** Por debajo de esto no vale la pena re-codificar. */
const SKIP_BELOW_BYTES = 300 * 1024;

/** Formatos que no tiene sentido (o no se puede) pasar por canvas. */
const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

let webpSupport: boolean | null = null;

function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

/**
 * Nombre de archivo seguro para un path de Storage: sin espacios, acentos ni paréntesis.
 * Hoy se sube `file.name` crudo, así que cosas como "IMG_2034 (1).jpeg" o "Foto ñandú.jpg"
 * terminan URL-encodeadas en el path.
 */
export function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return (
    base
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "imagen"
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Decodifica el archivo respetando la orientación EXIF. Sin `imageOrientation: "from-image"`
 * las fotos verticales del celular quedan acostadas al pasarlas por canvas.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Navegadores viejos no soportan la opción: caemos al <img>.
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo decodificar la imagen"));
    };
    img.src = url;
  });
}

export interface CompressResult {
  file: File;
  /** false = se devuelve el original tal cual (ya era chico, o algo falló). */
  changed: boolean;
}

export async function compressImage(file: File): Promise<CompressResult> {
  if (SKIP_TYPES.has(file.type)) return { file, changed: false };

  let bitmap: ImageBitmap | HTMLImageElement | null = null;
  const canvas = document.createElement("canvas");

  try {
    bitmap = await decode(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));

    // Ya está chica en píxeles y en bytes: re-codificar solo perdería calidad.
    if (scale === 1 && file.size <= SKIP_BELOW_BYTES) return { file, changed: false };

    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, changed: false };
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const type = supportsWebp() ? "image/webp" : "image/jpeg";
    const blob = await canvasToBlob(canvas, type, QUALITY);
    if (!blob) return { file, changed: false };

    // No achicamos el lienzo y encima pesa más: no ganamos nada.
    if (scale === 1 && blob.size >= file.size) return { file, changed: false };

    const ext = type === "image/webp" ? "webp" : "jpg";
    const out = new File([blob], `${sanitizeFileName(file.name)}.${ext}`, {
      type,
      lastModified: Date.now(),
    });
    return { file: out, changed: true };
  } catch (error) {
    // Formato raro, falta de memoria, lo que sea: subimos el original y seguimos.
    console.error("Compresión fallida, se sube el original:", error);
    return { file, changed: false };
  } finally {
    if (bitmap && "close" in bitmap) bitmap.close();
    // iOS limita fuerte la memoria de canvas: conviene liberarlo explícitamente.
    canvas.width = canvas.height = 0;
  }
}

// Decodificar varias fotos de 12 MB a la vez tira la pestaña en iOS. Encolamos las compresiones
// de a una; las SUBIDAS siguen yendo en paralelo, que es lo que se ve en la UI.
let queue: Promise<unknown> = Promise.resolve();

export function compressQueued(file: File): Promise<CompressResult> {
  const run = queue.then(() => compressImage(file));
  queue = run.catch(() => {});
  return run;
}
