import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/firebase/products";

/**
 * Sirve el manual (PDF) de un producto desde el propio dominio de la tienda.
 *
 * Hace falta porque Firebase Storage no manda `Access-Control-Allow-Origin` en las descargas
 * reales (sí en los 404), así que pdf.js no puede leer el archivo directo desde el browser.
 * Pasar por acá evita CORS y además deja una URL estable sin el token de Storage.
 *
 * El `?v=` lo agrega el visor con un hash de la URL actual del manual: si el admin lo
 * reemplaza, cambia la URL y la caché (browser/CDN) no sirve el PDF viejo.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product?.manualUrl) {
    return NextResponse.json({ error: "Manual no encontrado" }, { status: 404 });
  }

  // Solo se proxean archivos de nuestro Storage (la URL la carga el admin, pero igual).
  let manualUrl: URL;
  try {
    manualUrl = new URL(product.manualUrl);
  } catch {
    return NextResponse.json({ error: "URL del manual inválida" }, { status: 500 });
  }
  if (manualUrl.hostname !== "firebasestorage.googleapis.com") {
    return NextResponse.json({ error: "Origen del manual no permitido" }, { status: 500 });
  }

  // pdf.js pide rangos (Range) para cargar de a partes; se reenvían tal cual.
  const range = request.headers.get("range");
  const upstream = await fetch(manualUrl, {
    headers: range ? { range } : undefined,
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "No se pudo obtener el manual" }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="manual-${slug}.pdf"`,
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
  });
  for (const name of ["content-length", "content-range", "accept-ranges", "etag"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
