import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyPaymentAdjustment,
  computePricing,
  orderAdjustment,
  sanitizePaymentAdjustments,
} from "./pricing.ts";

const ENVIO = 2500;

const item = (productId: string, price: number, quantity = 1) => ({
  productId,
  price,
  quantity,
});

test("sin ajustes ni descuento global: total = subtotal + envío", () => {
  const r = computePricing({
    items: [item("a", 25000), item("b", 10000, 2)],
    method: "mercadopago",
    shippingCost: ENVIO,
  });

  assert.equal(r.subtotal, 45000);
  assert.equal(r.adjustment, 0);
  assert.equal(r.adjustmentLabel, "");
  assert.equal(r.total, 47500);
});

test("las 4 combinaciones de mode x type", () => {
  const base = 20000;
  assert.equal(
    applyPaymentAdjustment(base, { mode: "surcharge", type: "percentage", value: 10 }),
    22000
  );
  assert.equal(
    applyPaymentAdjustment(base, { mode: "discount", type: "percentage", value: 10 }),
    18000
  );
  assert.equal(
    applyPaymentAdjustment(base, { mode: "surcharge", type: "fixed", value: 5000 }),
    25000
  );
  assert.equal(
    applyPaymentAdjustment(base, { mode: "discount", type: "fixed", value: 5000 }),
    15000
  );
});

test("el descuento global de transferencia solo aplica a productos sin ajuste propio", () => {
  const r = computePricing({
    items: [item("propio", 20000), item("global", 10000)],
    method: "transfer",
    adjustments: {
      propio: { mode: "discount", type: "fixed", value: 5000 },
    },
    transferDiscountPercent: 10,
    shippingCost: 0,
  });

  // propio: 20000 - 5000 = 15000 ; global: 10000 - 10% = 9000
  assert.equal(r.lines[0].unit, 15000);
  assert.equal(r.lines[1].unit, 9000);
  assert.equal(r.subtotal, 30000);
  assert.equal(r.adjustment, -6000);
  assert.equal(r.total, 24000);
});

test("el descuento global no se aplica cuando el medio es MercadoPago", () => {
  const r = computePricing({
    items: [item("a", 10000)],
    method: "mercadopago",
    transferDiscountPercent: 10,
    shippingCost: 0,
  });

  assert.equal(r.adjustment, 0);
  assert.equal(r.total, 10000);
});

test("un recargo propio de transferencia pisa al descuento global", () => {
  const r = computePricing({
    items: [item("a", 10000)],
    method: "transfer",
    adjustments: { a: { mode: "surcharge", type: "percentage", value: 5 } },
    transferDiscountPercent: 20,
    shippingCost: 0,
  });

  assert.equal(r.adjustment, 500);
  assert.equal(r.adjustmentLabel, "Recargo transferencia");
  assert.equal(r.total, 10500);
});

test("un descuento fijo mayor al precio deja el unitario en 0, nunca negativo", () => {
  const r = computePricing({
    items: [item("a", 3000)],
    method: "transfer",
    adjustments: { a: { mode: "discount", type: "fixed", value: 5000 } },
    shippingCost: 0,
  });

  assert.equal(r.lines[0].unit, 0);
  assert.equal(r.adjustment, -3000);
  assert.equal(r.total, 0);
});

test("redondeo por unidad, después por cantidad", () => {
  // 3333 + 10% = 3666.3 → 3666 por unidad; ×3 = 10998 (no 10999, que saldría de 9999+10%)
  const r = computePricing({
    items: [item("a", 3333, 3)],
    method: "mercadopago",
    adjustments: { a: { mode: "surcharge", type: "percentage", value: 10 } },
    shippingCost: 0,
  });

  assert.equal(r.lines[0].unit, 3666);
  assert.equal(r.subtotal, 9999);
  assert.equal(r.adjustment, 999);
  assert.equal(r.total, 10998);
});

test("carrito con signos mezclados: la etiqueta sigue al neto", () => {
  const r = computePricing({
    items: [item("recargo", 10000), item("descuento", 10000)],
    method: "mercadopago",
    adjustments: {
      recargo: { mode: "surcharge", type: "fixed", value: 3000 },
      descuento: { mode: "discount", type: "fixed", value: 1000 },
    },
    shippingCost: 0,
  });

  assert.equal(r.adjustment, 2000);
  assert.equal(r.adjustmentLabel, "Recargo MercadoPago");
});

test("usa la descripción del admin si todas las líneas comparten la misma", () => {
  const adj = {
    mode: "surcharge" as const,
    type: "percentage" as const,
    value: 10,
    description: "Recargo por financiación",
  };
  const r = computePricing({
    items: [item("a", 10000), item("b", 20000)],
    method: "mercadopago",
    adjustments: { a: adj, b: adj },
    shippingCost: 0,
  });

  assert.equal(r.adjustmentLabel, "Recargo por financiación");
});

test("invariante: Σ lineTotal + envío === total", () => {
  const r = computePricing({
    items: [item("a", 7777, 3), item("b", 1234, 7), item("c", 99, 2)],
    method: "transfer",
    adjustments: { a: { mode: "surcharge", type: "percentage", value: 13 } },
    transferDiscountPercent: 7,
    shippingCost: ENVIO,
  });

  const suma = r.lines.reduce((s, l) => s + l.lineTotal, 0);
  assert.equal(suma + r.shippingCost, r.total);
});

test("sanitizePaymentAdjustments siempre devuelve las dos claves", () => {
  const out = sanitizePaymentAdjustments({
    transfer: { mode: "discount", type: "fixed", value: 5000 },
  });

  assert.deepEqual(Object.keys(out).sort(), ["mercadopago", "transfer"]);
  assert.equal(out.mercadopago, null);
  assert.equal(out.transfer?.value, 5000);
});

test("sanitizePaymentAdjustments descarta basura y clampea", () => {
  const out = sanitizePaymentAdjustments({
    mercadopago: { mode: "surcharge", type: "percentage", value: "250" },
    transfer: { mode: "cualquiera", type: "fixed", value: 100 },
  });

  assert.equal(out.mercadopago?.value, 100); // clampeado a 100%
  assert.equal(out.transfer, null); // mode inválido

  assert.equal(sanitizePaymentAdjustments(null).mercadopago, null);
  assert.equal(
    sanitizePaymentAdjustments({ mercadopago: { mode: "surcharge", type: "fixed", value: 0 } })
      .mercadopago,
    null
  );
});

test("sanitizePaymentAdjustments recorta la descripción", () => {
  const out = sanitizePaymentAdjustments({
    mercadopago: {
      mode: "surcharge",
      type: "fixed",
      value: 1000,
      description: "  " + "x".repeat(120) + "  ",
    },
  });

  assert.equal(out.mercadopago?.description?.length, 80);
});

test("orderAdjustment cae al campo legacy discount", () => {
  assert.deepEqual(orderAdjustment({ discount: 5000 }), {
    amount: -5000,
    label: "Descuento",
  });
  assert.deepEqual(
    orderAdjustment({ paymentAdjustment: { amount: 2000, label: "Recargo MercadoPago" }, discount: 0 }),
    { amount: 2000, label: "Recargo MercadoPago" }
  );
  assert.equal(orderAdjustment({}), null);
  assert.equal(orderAdjustment({ discount: 0, paymentAdjustment: null }), null);
});
