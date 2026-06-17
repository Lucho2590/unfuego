// Inicia el flujo OAuth: devuelve la URL de autorización de MercadoPago. El cliente hace
// window.location.href = url. firebase-admin no corre en Edge ⇒ runtime nodejs.
import { NextResponse } from "next/server";
import { requireAdminEmail } from "@/lib/auth/admin-guard";
import { buildAuthUrl } from "@/lib/mercadopago/oauth";

export const runtime = "nodejs";

export async function POST() {
  if (!(await requireAdminEmail())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const url = await buildAuthUrl();
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar la conexión" },
      { status: 500 }
    );
  }
}
