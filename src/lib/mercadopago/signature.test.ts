import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyWebhookSignature, parseSignatureHeader } from "./signature.ts";

const SECRET = "test_webhook_secret_123";

/** Helper: arma un header x-signature válido para los datos dados. */
function sign(dataId: string, requestId: string, ts: string, secret = SECRET): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

test("parseSignatureHeader extrae ts y v1", () => {
  assert.deepEqual(parseSignatureHeader("ts=123,v1=abc"), { ts: "123", v1: "abc" });
  assert.deepEqual(parseSignatureHeader("v1=abc,ts=123"), { ts: "123", v1: "abc" });
});

test("firma válida pasa", () => {
  const ts = "1700000000";
  const header = sign("PAYMENT123", "req-1", ts);
  assert.equal(verifyWebhookSignature(header, "req-1", "PAYMENT123", SECRET), true);
});

test("dataId con mayúsculas se normaliza a minúsculas", () => {
  const ts = "1700000000";
  // El header se firma con el dataId en minúsculas; verificar con mayúsculas debe pasar.
  const header = sign("ABCDEF", "req-2", ts);
  assert.equal(verifyWebhookSignature(header, "req-2", "ABCDEF", SECRET), true);
});

test("secret incorrecto falla", () => {
  const ts = "1700000000";
  const header = sign("pay1", "req-3", ts);
  assert.equal(verifyWebhookSignature(header, "req-3", "pay1", "otro_secret"), false);
});

test("v1 manipulado falla", () => {
  const ts = "1700000000";
  const header = sign("pay1", "req-4", ts).replace(/v1=.*/, "v1=deadbeef");
  assert.equal(verifyWebhookSignature(header, "req-4", "pay1", SECRET), false);
});

test("header sin ts falla", () => {
  assert.equal(verifyWebhookSignature("v1=abc123", "req-5", "pay1", SECRET), false);
});

test("requestId distinto falla (forma parte del manifest)", () => {
  const ts = "1700000000";
  const header = sign("pay1", "req-correcto", ts);
  assert.equal(verifyWebhookSignature(header, "req-distinto", "pay1", SECRET), false);
});

test("inputs nulos fallan sin tirar", () => {
  assert.equal(verifyWebhookSignature(null, "r", "p", SECRET), false);
  assert.equal(verifyWebhookSignature("ts=1,v1=ab", "r", null, SECRET), false);
  assert.equal(verifyWebhookSignature("ts=1,v1=ab", "r", "p", ""), false);
});
