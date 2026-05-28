import { z } from "zod";

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(8, "Teléfono requerido"),
  }),
  shipping: z.object({
    address: z.string().min(3, "Dirección requerida"),
    city: z.string().min(2, "Ciudad requerida"),
    province: z.string().min(2, "Provincia requerida"),
    postalCode: z.string().min(4, "Código postal requerido"),
    notes: z.string().optional(),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
