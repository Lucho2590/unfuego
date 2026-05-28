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

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: OrderCustomer;
  shipping: OrderShipping;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  mercadopago: {
    preferenceId: string;
    paymentId?: string;
    paymentStatus?: string;
    merchantOrderId?: string;
  };
  emailsSent: {
    confirmation: boolean;
    adminNotification: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutFormData {
  customer: OrderCustomer;
  shipping: OrderShipping;
}
