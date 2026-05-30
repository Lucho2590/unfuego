import { NextResponse } from "next/server";
import { getPublicTransferSettings } from "@/lib/transfer/settings";

/**
 * Settings públicas de transferencia (no secretas): las consume el CheckoutForm para
 * decidir si mostrar la opción y con qué % de descuento, y la página de transferencia.
 */
export async function GET() {
  try {
    const settings = await getPublicTransferSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error leyendo settings públicas de transferencia:", error);
    // Ante error, responder deshabilitado para no romper el checkout.
    return NextResponse.json({ enabled: false, discountPercent: 0 });
  }
}
