// Firebase server utilities — NO Admin SDK
// Uses Firestore REST API + Google Identity API

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "unfuego";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Firestore value conversion ───

type FsValue = Record<string, unknown>;

function toFsValue(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFsValue) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, FsValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toFsValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFsValue(val: Record<string, unknown>): unknown {
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return val.doubleValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("timestampValue" in val) return val.timestampValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    const arr = val.arrayValue as { values?: FsValue[] };
    return (arr?.values ?? []).map(fromFsValue);
  }
  if ("mapValue" in val) {
    const map = val.mapValue as { fields?: Record<string, FsValue> };
    return parseFields(map?.fields ?? {});
  }
  return null;
}

function parseFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = fromFsValue(val);
  }
  return result;
}

function docId(name: string): string {
  return name.split("/").pop()!;
}

// ─── Firestore CRUD ───

export async function fsGet(collection: string, id: string) {
  const res = await fetch(`${FIRESTORE_BASE}/${collection}/${id}?key=${API_KEY}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`fsGet error: ${res.status}`);
  }
  const doc = await res.json();
  return { id: docId(doc.name), ...parseFields(doc.fields ?? {}) };
}

export async function fsQuery(
  collection: string,
  filters?: { field: string; op: string; value: unknown }[],
  orderBy?: { field: string; direction?: "ASCENDING" | "DESCENDING" },
  limit?: number
) {
  const q: Record<string, unknown> = {
    from: [{ collectionId: collection }],
  };

  if (filters?.length) {
    q.where =
      filters.length === 1
        ? {
            fieldFilter: {
              field: { fieldPath: filters[0].field },
              op: filters[0].op,
              value: toFsValue(filters[0].value),
            },
          }
        : {
            compositeFilter: {
              op: "AND",
              filters: filters.map((f) => ({
                fieldFilter: {
                  field: { fieldPath: f.field },
                  op: f.op,
                  value: toFsValue(f.value),
                },
              })),
            },
          };
  }

  if (orderBy) {
    q.orderBy = [{ field: { fieldPath: orderBy.field }, direction: orderBy.direction ?? "DESCENDING" }];
  }
  if (limit) q.limit = limit;

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredQuery: q }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fsQuery error: ${res.status} ${text}`);
  }

  const results: { document?: { name: string; fields?: Record<string, FsValue> } }[] = await res.json();
  return results
    .filter((r) => r.document)
    .map((r) => ({ id: docId(r.document!.name), ...parseFields(r.document!.fields ?? {}) }));
}

export async function fsAdd(collection: string, data: Record<string, unknown>): Promise<string> {
  const fields: Record<string, FsValue> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFsValue(value);
  }
  const now = new Date().toISOString();
  fields.createdAt = { timestampValue: now };
  fields.updatedAt = { timestampValue: now };

  const res = await fetch(`${FIRESTORE_BASE}/${collection}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fsAdd error: ${res.status} ${text}`);
  }
  const doc = await res.json();
  return docId(doc.name);
}

/**
 * Crea o sobrescribe un documento con un ID propio (a diferencia de fsAdd que autogenera).
 * Con `createOnly: true` usa la precondición `currentDocument.exists=false`: si el doc ya
 * existe, Firestore responde 409/412 y se devuelve `{ created: false }` (idempotencia atómica,
 * usada para el audit trail del webhook). Soporta paths con subcolección
 * (ej. `orders/{orderId}/events`).
 */
export async function fsSet(
  collection: string,
  id: string,
  data: Record<string, unknown>,
  opts?: { createOnly?: boolean; timestamps?: boolean }
): Promise<{ created: boolean }> {
  const fields: Record<string, FsValue> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFsValue(value);
  }
  if (opts?.timestamps) {
    const now = new Date().toISOString();
    if (!("createdAt" in fields)) fields.createdAt = { timestampValue: now };
    fields.updatedAt = { timestampValue: now };
  }

  const params = new URLSearchParams();
  if (opts?.createOnly) params.set("currentDocument.exists", "false");
  params.set("key", API_KEY);

  const res = await fetch(`${FIRESTORE_BASE}/${collection}/${id}?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });

  if (!res.ok) {
    // createOnly + doc ya existente → precondición fallida: no es un error, es idempotencia.
    if (opts?.createOnly && (res.status === 409 || res.status === 412 || res.status === 400)) {
      const text = await res.text();
      if (text.includes("FAILED_PRECONDITION") || text.includes("ALREADY_EXISTS")) {
        return { created: false };
      }
      throw new Error(`fsSet error: ${res.status} ${text}`);
    }
    const text = await res.text();
    throw new Error(`fsSet error: ${res.status} ${text}`);
  }
  return { created: true };
}

export async function fsUpdate(collection: string, id: string, data: Record<string, unknown>) {
  const fields: Record<string, FsValue> = {};
  const paths: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFsValue(value);
    paths.push(key);
  }
  fields.updatedAt = { timestampValue: new Date().toISOString() };
  paths.push("updatedAt");

  const mask = paths.map((f) => `updateMask.fieldPaths=${f}`).join("&");
  const res = await fetch(`${FIRESTORE_BASE}/${collection}/${id}?${mask}&key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fsUpdate error: ${res.status} ${text}`);
  }
}

export async function fsDelete(collection: string, id: string) {
  const res = await fetch(`${FIRESTORE_BASE}/${collection}/${id}?key=${API_KEY}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`fsDelete error: ${res.status}`);
}

// ─── Auth: verify ID token ───

export async function verifyIdToken(idToken: string): Promise<{ email: string; uid: string } | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.users?.[0];
    if (!user) return null;
    return { email: user.email, uid: user.localId };
  } catch {
    return null;
  }
}
