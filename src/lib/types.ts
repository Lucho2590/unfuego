export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  isActive: boolean;
  weight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface OrderShipping {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "shipped"
  | "delivered";

// Estado del pago normalizado (independiente de los estados de MercadoPago).
// Convive con `status` (legacy/logístico): updateOrderPayment deriva uno del otro.
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

export type PaymentProvider = "mercadopago" | "transfer";

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  // Ausente = "mercadopago" (órdenes legacy creadas antes de sumar transferencia).
  paymentProvider?: PaymentProvider;
  customer: OrderCustomer;
  shipping: OrderShipping;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  // Descuento aplicado en ARS (ej. por pagar con transferencia). Opcional.
  discount?: number;
  total: number;
  // Opcional: las órdenes de transferencia no usan MercadoPago.
  mercadopago?: {
    preferenceId: string;
    paymentId?: string;
    paymentStatus?: string;
    merchantOrderId?: string;
  };
  // Datos del flujo de transferencia bancaria (solo si paymentProvider === "transfer").
  bankTransfer?: {
    // Capability token: solo viaja en el link del email; habilita subir el comprobante.
    accessToken?: string;
    receiptUrl?: string;
    reviewedBy?: string;
    reviewedAt?: string;
  };
  // Datos de despacho cargados por el admin al marcar el pedido como "shipped".
  tracking?: {
    number: string;
    url: string;
  };
  emailsSent: {
    confirmation: boolean;
    adminNotification: boolean;
    shipped?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── MercadoPago settings (solo el modo activo vive en DB; los tokens son env vars) ───

export type MercadoPagoMode = "test" | "production";

export interface MercadoPagoSettings {
  activeMode: MercadoPagoMode;
  updatedAt?: string;
  updatedBy?: string;
}

// Forma enmascarada que devuelve el endpoint admin a la UI (nunca el token completo).
export interface MercadoPagoSettingsUI {
  activeMode: MercadoPagoMode;
  test: { configured: boolean; tokenMasked: string | null };
  production: { configured: boolean; tokenMasked: string | null };
  updatedAt?: string;
  updatedBy?: string;
}

// ─── Transferencia bancaria (datos NO secretos: se muestran al comprador) ───

export interface TransferSettings {
  enabled: boolean;
  discountPercent: number; // 0–100
  bank: string;
  titular: string;
  cbu: string;
  alias: string;
  cuit: string;
  instructions: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CheckoutFormData {
  customer: OrderCustomer;
  shipping: OrderShipping;
}
