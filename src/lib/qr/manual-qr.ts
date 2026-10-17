// QR de la vista previa del manual con el diseño de la marca. Corre en el navegador del admin.
//
// Dos piezas:
//  - `generateManualQr`: solo el código (módulos redondeados, llama en el centro), para pegarlo
//    en cualquier diseño.
//  - `generateManualCard`: tarjeta lista para imprimir: fondo oscuro, wordmark, el QR en una
//    placa blanca, nombre del producto y leyenda.
//
// Monocromo a propósito: módulos negros sobre blanco es lo que leen todos los celulares; los QR
// invertidos o de color fallan en lectores viejos.

/** Lado del PNG del QR. 1024 alcanza para imprimirlo a 8-10 cm nítido. */
const QR_SIZE = 1024;

/** Tarjeta 3:4. */
const CARD_W = 1200;
const CARD_H = 1600;

const CARD_BG = "#0a0a0a";
const CARD_TEXT = "#eeeeee";
const CARD_MUTED = "#8a8a8a";

/** La llama del favicon (viewBox 170 180 220 280), en blanco sobre una placa negra redondeada. */
const FLAME_PATH =
  "M371.88,390.21c-5.48,36.71-46.61,57.35-103.26,57.49-3.58,0-7.16-.06-10.67-.21-62.22-2.62-63.6-49.86-60.39-83.58,1.19-12.49,1.45-24.77-1.14-37.02-1.26-6.04-3.23-12.07-5.97-18.11,8.63,3.93,14.53,10.46,19.09,18.11,1.54,2.67,2.95,5.41,4.21,8.21.84-2.74,1.54-5.48,2.11-8.21,5.83-27.45-.42-55.11-16.5-78.76,4.91,1.05,8.99,4.35,13.27,7.3,19.73,13.62,33.55,33.41,39.66,56.58,6.18,23.31,5.12,38.82,2.88,59.25l-1.83,13.24c-3.63,28.64,27.5,25.44,32.91,24.74,10.74-1.4,14.94-2.71,20.48-7.67,1.28-1.15,2.3-3.14,3.37-5.57,2.21-5.03,3.03-10.56,2.91-16.05-.04-1.68-.1-3.32-.22-4.47,0-.28-.07-.56-.07-.84-4.07-35.59-35.73-62.97-44.93-105.72-6.32-29.48.21-60.02,24.08-78.83-11.86,22.32-9.13,47.8,5.69,68.37,18.39,25.55,44.43,36.08,63.04,68.44,3.44,5.9,6.88,12.35,9.41,19.94,5.97,18.95,1.9,43.38,1.9,43.38Z";

function flamePlateDataUrl(): string {
  // Placa 200x200; la llama (220x280) ocupa el 62% de alto, centrada.
  const scale = (200 * 0.62) / 280;
  const w = 220 * scale;
  const h = 280 * scale;
  const tx = (200 - w) / 2;
  const ty = (200 - h) / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">` +
    `<rect width="200" height="200" rx="36" fill="#000"/>` +
    `<path d="${FLAME_PATH}" fill="#fff" transform="translate(${tx} ${ty}) scale(${scale}) translate(-170 -180)"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob falló"))), "image/png")
  );
}

/** Solo el QR: PNG cuadrado, fondo blanco con margen, módulos redondeados y la llama al centro. */
export async function generateManualQr(url: string): Promise<Blob> {
  // Carga diferida: ~150 KB que solo paga el admin cuando lo usa.
  const { default: QRCodeStyling } = await import("qr-code-styling");

  const qr = new QRCodeStyling({
    type: "canvas",
    width: QR_SIZE,
    height: QR_SIZE,
    margin: Math.round(QR_SIZE * 0.06),
    data: url,
    image: flamePlateDataUrl(),
    // "H" tolera ~30% del código tapado: el logo al 30% del lado cubre ~9% y queda margen.
    qrOptions: { errorCorrectionLevel: "H" },
    imageOptions: { imageSize: 0.3, margin: 10, hideBackgroundDots: true },
    dotsOptions: { type: "rounded", color: "#000000" },
    cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
    cornersDotOptions: { type: "dot", color: "#000000" },
    backgroundOptions: { color: "#ffffff" },
  });

  const blob = await qr.getRawData("png");
  if (!(blob instanceof Blob)) throw new Error("No se pudo generar el QR");
  return blob;
}

/** Familia tipográfica del sitio (Geist, registrada por next/font en el body). */
async function siteFont(): Promise<string> {
  const family = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  try {
    await Promise.all([
      document.fonts.load(`300 56px ${family}`),
      document.fonts.load(`400 34px ${family}`),
    ]);
  } catch {
    // Si no se puede cargar, canvas usa el fallback de la familia igual.
  }
  return family;
}

/**
 * Tarjeta lista para imprimir (1200x1600): fondo oscuro de la marca, wordmark, el QR en una placa
 * blanca redondeada, el nombre del producto y la leyenda.
 */
export async function generateManualCard(url: string, productName: string): Promise<Blob> {
  const [qrBlob, wordmark, family] = await Promise.all([
    generateManualQr(url),
    loadImage("/images/logo.svg"),
    siteFont(),
  ]);
  const qrImage = await createImageBitmap(qrBlob);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.fillStyle = CARD_BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Wordmark. El SVG (1366x768) trae mucho aire alrededor del texto: se dibuja grande y el
  // texto queda centrado arriba.
  const logoW = 720;
  const logoH = (logoW * 768) / 1366;
  ctx.drawImage(wordmark, (CARD_W - logoW) / 2, 40, logoW, logoH);

  // Placa blanca redondeada con el QR adentro (el PNG del QR ya trae su margen blanco).
  const plate = 780;
  const px = (CARD_W - plate) / 2;
  const py = 400;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, py, plate, plate, 44);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(qrImage, px, py, plate, plate);
  ctx.restore();

  // Textos.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CARD_TEXT;
  ctx.font = `300 56px ${family}`;
  ctx.fillText(productName, CARD_W / 2, py + plate + 120, CARD_W - 160);
  ctx.fillStyle = CARD_MUTED;
  ctx.font = `400 34px ${family}`;
  ctx.fillText("Escaneá para ver el manual de armado", CARD_W / 2, py + plate + 185, CARD_W - 160);

  qrImage.close();
  return toBlob(canvas);
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
