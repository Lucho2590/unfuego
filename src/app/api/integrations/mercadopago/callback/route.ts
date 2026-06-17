// Callback OAuth: MercadoPago redirige acá (el browser del admin) con code/state. Canjea el
// código y redirige a la página de configuración con ?result. La firma del state es la prueba
// CSRF real; no bloqueamos solo por la cookie (puede perderse en el redirect cross-site).
// firebase-admin no corre en Edge ⇒ runtime nodejs.
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/mercadopago/oauth";

export const runtime = "nodejs";

const REDIRECT_PATH = "/admin/configuracion-de-pagos";

function redirect(req: NextRequest, params: Record<string, string>) {
  const url = new URL(REDIRECT_PATH, req.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const error = sp.get("error");
  if (error) {
    return redirect(req, { result: "mp_oauth_error", reason: error });
  }

  const code = sp.get("code");
  const state = sp.get("state");

  try {
    await exchangeCode(code, state);
    return redirect(req, { result: "mp_oauth_connected" });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "exchange_failed";
    return redirect(req, { result: "mp_oauth_error", reason });
  }
}
