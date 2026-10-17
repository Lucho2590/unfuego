// Genera el QR (PNG) de la vista previa del manual, con la llama de Un Fuego en el centro.
// Corre en el navegador del admin: usa canvas y la librería `qrcode`.

import QRCode from "qrcode";

/** Lado del PNG en px. 1024 alcanza para imprimir un QR de 8-10 cm nítido. */
const SIZE = 1024;
/** Fracción del lado que ocupa el logo. Con corrección "H" el QR tolera ~30% tapado. */
const LOGO_RATIO = 0.22;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

/** Devuelve el PNG del QR como Blob. */
export async function generateManualQr(url: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, {
    errorCorrectionLevel: "H",
    width: SIZE,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  // Logo: placa negra redondeada con borde blanco (para separarla de los módulos) y la
  // llama blanca encima. La llama es el favicon del sitio.
  const logo = Math.round(SIZE * LOGO_RATIO);
  const pad = Math.round(logo * 0.12);
  const x = (SIZE - logo) / 2;
  const y = (SIZE - logo) / 2;

  ctx.fillStyle = "#ffffff";
  roundedRect(ctx, x - pad, y - pad, logo + pad * 2, logo + pad * 2, logo * 0.22);
  ctx.fill();

  ctx.fillStyle = "#000000";
  roundedRect(ctx, x, y, logo, logo, logo * 0.18);
  ctx.fill();

  const flame = await loadImage("/favicon.svg");
  // El favicon tiene viewBox 220x280 (más alto que ancho): se encaja en el 62% de la placa.
  const box = logo * 0.62;
  const scale = Math.min(box / flame.width, box / flame.height);
  const fw = flame.width * scale;
  const fh = flame.height * scale;
  ctx.drawImage(flame, x + (logo - fw) / 2, y + (logo - fh) / 2, fw, fh);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob falló"))), "image/png")
  );
}

/** Dispara la descarga de un Blob con el nombre dado. */
export function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(href);
}
