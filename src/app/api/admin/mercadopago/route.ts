import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, fsQuery } from "@/lib/firebase/admin";
import { getSettingsForUI, setActiveMode } from "@/lib/mercadopago/settings";
import type { MercadoPagoMode } from "@/lib/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/**
 * Verificación reforzada: además de validar el token, chequea que el email sea admin
 * (lista de env o invitación aceptada). Más estricto que el verifyAdmin genérico porque
 * acá se administra la configuración de pagos. Devuelve el email si es admin, o null.
 */
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
    // si la query falla, denegar
  }
  return null;
}

export async function GET() {
  if (!(await requireAdminEmail())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const settings = await getSettingsForUI();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error leyendo settings MP:", error);
    return NextResponse.json({ error: "Error al leer la configuración" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const adminEmail = await requireAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { activeMode } = (await request.json()) as { activeMode?: MercadoPagoMode };
    if (activeMode !== "test" && activeMode !== "production") {
      return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
    }

    await setActiveMode(activeMode, adminEmail);
    const settings = await getSettingsForUI();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al cambiar el modo activo",
      },
      { status: 400 }
    );
  }
}
