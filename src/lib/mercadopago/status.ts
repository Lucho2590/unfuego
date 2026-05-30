import type { PaymentStatus } from "../types";

/**
 * Mapea el estado de un pago de MercadoPago a nuestro PaymentStatus normalizado.
 * Ver: https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get
 */
export function mapMercadoPagoStatus(mpStatus: string | null | undefined): PaymentStatus {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return "completed";
    case "rejected":
    case "cancelled":
      return "failed";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "in_process":
    case "in_mediation":
    case "pending":
      return "processing";
    default:
      return "pending";
  }
}
