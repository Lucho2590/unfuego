import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/firebase/admin";

/**
 * Proxy (solo admin) para leer un PDF ya subido a Storage desde el navegador, para generar
 * la vista previa de un manual cargado antes de esta función. Storage no manda CORS en las
 * descargas, así que `fetch(manualUrl)` directo desde el admin falla.
 */
export async function GET(request: Request) {
  const session = (await cookies()).get("__session");
  if (!session?.value || !(await verifySession(session.value))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("url");
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }
  if (url.hostname !== "firebasestorage.googleapis.com") {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 400 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok) {
    return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: 502 });
  }
  return new Response(upstream.body, {
    headers: { "Content-Type": "application/pdf", "Cache-Control": "private, no-store" },
  });
}
