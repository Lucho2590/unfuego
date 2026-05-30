import { NextResponse } from "next/server";
import { getPublicMercadoPagoSettings } from "@/lib/mercadopago/settings";

/**
 * Settings públicas (no secretas) de MercadoPago: las consume el CheckoutForm para decidir si
 * mostrar la opción de pago con MercadoPago.
 */
export async function GET() {
  try {
    const settings = await getPublicMercadoPagoSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error leyendo settings públicas de MercadoPago:", error);
    // Ante error, responder no disponible para no romper el checkout.
    return NextResponse.json({ enabled: false, available: false });
  }
}
