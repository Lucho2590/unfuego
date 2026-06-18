// Desconecta la integración OAuth: limpia tokens y deja status="disconnected".
// firebase-admin no corre en Edge ⇒ runtime nodejs.
import { NextResponse } from "next/server";
import { requireAdminEmail } from "@/lib/auth/admin-guard";
import { disconnectOAuth, getOAuthUI } from "@/lib/mercadopago/oauth";

export const runtime = "nodejs";

export async function POST() {
  const adminEmail = await requireAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await disconnectOAuth(adminEmail);
    return NextResponse.json({ success: true, oauth: await getOAuthUI() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo desconectar" },
      { status: 500 }
    );
  }
}
