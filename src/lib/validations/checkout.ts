import { z } from "zod";

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    // E.164: "+" + código de país + número (ej. +5492235053759).
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Teléfono inválido"),
  }),
  shipping: z.object({
    // Domicilio como único string: "Calle Número, Ciudad (CP), Provincia, País".
    address: z.string().min(3, "Dirección requerida"),
    notes: z.string().optional(),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
