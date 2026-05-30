import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, fsQuery } from "@/lib/firebase/admin";
import {
  getSettingsForUI,
  setActiveMode,
  setEnabled,
  saveMercadoPagoCredentials,
} from "@/lib/mercadopago/settings";
import type { MercadoPagoMode } from "@/lib/types";

type PutBody =
  | { action?: "setMode"; activeMode: MercadoPagoMode }
  | { action: "setEnabled"; enabled: boolean }
  | {
      action: "saveCredentials";
      mode: MercadoPagoMode;
      accessToken?: string;
      webhookSecret?: string;
    };

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

  const user = await verifySession(session.value);
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
    const body = (await request.json()) as PutBody;

    if (body.action === "saveCredentials") {
      if (body.mode !== "test" && body.mode !== "production") {
        return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
      }
      await saveMercadoPagoCredentials(
        body.mode,
        { accessToken: body.accessToken, webhookSecret: body.webhookSecret },
        adminEmail
      );
    } else if (body.action === "setEnabled") {
      await setEnabled(!!body.enabled, adminEmail);
    } else {
      // action "setMode" (o payload legacy { activeMode }).
      const activeMode = body.activeMode;
      if (activeMode !== "test" && activeMode !== "production") {
        return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
      }
      await setActiveMode(activeMode, adminEmail);
    }

    const settings = await getSettingsForUI();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al guardar la configuración",
      },
      { status: 400 }
    );
  }
}
