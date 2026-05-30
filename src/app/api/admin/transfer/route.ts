import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, fsQuery } from "@/lib/firebase/admin";
import { getTransferSettings, saveTransferSettings } from "@/lib/transfer/settings";
import type { TransferSettings } from "@/lib/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/** Igual que en el route de MercadoPago: valida token + que el email sea admin. */
async function requireAdminEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session?.value) return null;

  const user = await verifyIdToken(session.value);
  if (!user) return null;

  if (ADMIN_EMAILS.includes(user.email)) return user.email;

  try {
    const invitations = await fsQuery("admin_invitations", [
      { field: "email", op: "EQUAL", value: user.email },
    ]);
    if (invitations.length > 0) return user.email;
  } catch {
    // denegar si falla
  }
  return null;
}

export async function GET() {
  if (!(await requireAdminEmail())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const settings = await getTransferSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error leyendo settings transferencia:", error);
    return NextResponse.json({ error: "Error al leer la configuración" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const adminEmail = await requireAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const input = (await request.json()) as Partial<TransferSettings>;
    await saveTransferSettings(input, adminEmail);
    const settings = await getTransferSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al guardar la configuración",
      },
      { status: 400 }
    );
  }
}
