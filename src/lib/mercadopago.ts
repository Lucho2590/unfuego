import { MercadoPagoConfig } from "mercadopago";

export const mercadopago = process.env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
  : (null as unknown as MercadoPagoConfig);
