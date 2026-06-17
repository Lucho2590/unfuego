import { NextResponse } from "next/server";
import { requireAdminEmail } from "@/lib/auth/admin-guard";
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
