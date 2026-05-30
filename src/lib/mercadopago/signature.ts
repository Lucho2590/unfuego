import crypto from "crypto";

/**
 * Verifica la firma HMAC-SHA256 de un webhook de MercadoPago.
 *
 * MercadoPago manda el header `x-signature` con la forma `ts=<timestamp>,v1=<hash>` y el header
 * `x-request-id`. El hash `v1` es el HMAC-SHA256 (en hex) del "manifest":
 *
 *   id:<dataId.toLowerCase()>;request-id:<requestId>;ts:<ts>;
 *
 * firmado con el webhook secret de la app. La comparación se hace en tiempo constante
 * (`crypto.timingSafeEqual`) para no filtrar información por timing.
 *
 * @returns true si la firma es válida para el secret dado.
 */
export function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
  secret: string
): boolean {
  if (!xSignature || !dataId || !secret) return false;

  const { ts, v1 } = parseSignatureHeader(xSignature);
  if (!ts || !v1) return false;

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return timingSafeEqualHex(expected, v1);
}

/** Parsea el header `x-signature` ("ts=...,v1=...") en sus partes. */
export function parseSignatureHeader(header: string): { ts?: string; v1?: string } {
  const out: { ts?: string; v1?: string } = {};
  for (const part of header.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "ts") out.ts = value;
    else if (key === "v1") out.v1 = value;
  }
  return out;
}

/** Comparación constant-time de dos strings hex. Devuelve false si difieren en longitud. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
