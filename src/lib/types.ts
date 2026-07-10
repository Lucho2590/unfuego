export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  images: string[];
  manualUrl?: string | null; // URL de descarga del manual de armado en PDF (Firebase Storage)
  manualLabel?: string | null; // texto del botón de descarga; si es null usa el default
  category: string;
  stock: number;
  isActive: boolean;
  comingSoon?: boolean; // true = "Próximamente": visible pero no se puede comprar
  weight?: number;
  sortOrder?: number; // menor = aparece primero; sin valor = al final
  discountType?: DiscountType | null; // tipo de descuento manual; null = sin descuento
  discountValue?: number | null; // % (0-100) o monto en $ según discountType
  discountDescription?: string | null; // ej. "Por día del padre"
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = "percentage" | "fixed";

export interface Section {
  id: string;
  name: string;
  slug: string; // autogenerado del nombre; útil para filtros por URL a futuro
  sortOrder?: number; // menor primero (mismo criterio que productos)
  isActive: boolean;
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
  // Domicilio como único string: "Calle Número, Ciudad (CP), Provincia, País".
  address: string;
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

// ─── MercadoPago settings ───
// El modo activo y las credenciales (encriptadas) viven en DB; además se soporta fallback a
// env vars. Los tokens nunca se guardan ni se devuelven en claro.

export type MercadoPagoMode = "test" | "production";

// Credenciales de un modo, encriptadas (formato "v1:...") tal como se persisten en Firestore.
export interface EncryptedModeCreds {
  accessTokenEnc?: string;
  webhookSecretEnc?: string;
}

// Estado de la conexión OAuth con MercadoPago. Vive dentro del doc `settings/mercadopago`.
// Los tokens se guardan encriptados (formato "v1:...") aunque las rules ya cierren la colección
// al cliente (defensa en profundidad). OAuth es la forma principal de conectar; las credenciales
// estáticas (test/production) quedan como fallback.
export type MercadoPagoOAuthStatus = "disconnected" | "pending" | "connected" | "error";

export interface MercadoPagoOAuth {
  status: MercadoPagoOAuthStatus;
  accessTokenEnc?: string;
  refreshTokenEnc?: string;
  expiresAt?: string; // ISO; vencimiento del access token
  accountId?: string; // user_id de MP
  publicKey?: string;
  liveMode?: boolean; // del token response (producción vs sandbox)
  email?: string;
  nickname?: string;
  codeVerifierEnc?: string; // temporal: se setea en status=pending, se borra al conectar
  connectedAt?: string;
  lastError?: string;
}

export interface MercadoPagoSettings {
  activeMode: MercadoPagoMode;
  // Si está deshabilitado, MercadoPago no se ofrece en el checkout. Default (ausente) = true.
  enabled?: boolean;
  test?: EncryptedModeCreds;
  production?: EncryptedModeCreds;
  oauth?: MercadoPagoOAuth;
  updatedAt?: string;
  updatedBy?: string;
}

// De dónde se resolvieron las credenciales de un modo.
export type CredsSource = "db" | "env" | null;

// Forma enmascarada que devuelve el endpoint admin a la UI (nunca el token completo).
export interface MercadoPagoModeUI {
  configured: boolean;
  tokenMasked: string | null;
  source: CredsSource;
  hasWebhookSecret: boolean;
}

// Proyección NO secreta del estado OAuth para la UI de admin (nunca expone tokens).
export interface MercadoPagoOAuthUI {
  status: MercadoPagoOAuthStatus;
  email?: string;
  nickname?: string;
  liveMode?: boolean;
  connectedAt?: string;
  lastError?: string;
}

export interface MercadoPagoSettingsUI {
  activeMode: MercadoPagoMode;
  enabled: boolean;
  test: MercadoPagoModeUI;
  production: MercadoPagoModeUI;
  oauth: MercadoPagoOAuthUI;
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
