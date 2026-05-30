// Firebase server utilities — Firebase Admin SDK (service account).
// El acceso pasa por el Admin SDK, que BYPASSA las security rules: la DB queda protegida por
// las rules para el cliente y accesible solo desde el server. Módulo server-only.
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb, getAdminAuth } from "./admin-app";

// ─── Normalización de lectura ───
// El SDK devuelve `Timestamp` para campos de fecha; los convertimos a ISO string para preservar
// el contrato que tenían los consumidores con la implementación REST anterior.
function normalize(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object" && (value as object).constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalize(v);
    }
    return out;
  }
  return value;
}

function normalizeDoc(id: string, data: Record<string, unknown> | undefined) {
  return { id, ...(normalize(data ?? {}) as Record<string, unknown>) };
}

// Mapea los operadores legacy (estilo REST) a los del SDK.
const OP_MAP: Record<string, FirebaseFirestore.WhereFilterOp> = {
  EQUAL: "==",
  NOT_EQUAL: "!=",
  LESS_THAN: "<",
  LESS_THAN_OR_EQUAL: "<=",
  GREATER_THAN: ">",
  GREATER_THAN_OR_EQUAL: ">=",
  ARRAY_CONTAINS: "array-contains",
  IN: "in",
  ARRAY_CONTAINS_ANY: "array-contains-any",
  NOT_IN: "not-in",
};

// ─── Firestore CRUD ───

export async function fsGet(collection: string, id: string) {
  const snap = await getAdminDb().doc(`${collection}/${id}`).get();
  if (!snap.exists) return null;
  return normalizeDoc(snap.id, snap.data());
}

export async function fsQuery(
  collection: string,
  filters?: { field: string; op: string; value: unknown }[],
  orderBy?: { field: string; direction?: "ASCENDING" | "DESCENDING" },
  limit?: number
) {
  let q: FirebaseFirestore.Query = getAdminDb().collection(collection);

  for (const f of filters ?? []) {
    q = q.where(f.field, OP_MAP[f.op] ?? "==", f.value);
  }
  if (orderBy) {
    q = q.orderBy(orderBy.field, orderBy.direction === "ASCENDING" ? "asc" : "desc");
  }
  if (limit) q = q.limit(limit);

  const snap = await q.get();
  return snap.docs.map((d) => normalizeDoc(d.id, d.data()));
}

export async function fsAdd(collection: string, data: Record<string, unknown>): Promise<string> {
  const now = Timestamp.now();
  const ref = await getAdminDb().collection(collection).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

/**
 * Crea o sobrescribe un documento con un ID propio (a diferencia de fsAdd que autogenera).
 * - `merge: true` → merge superficial/profundo (no borra campos no enviados).
 * - `createOnly: true` → falla si el doc ya existe y devuelve `{ created: false }` (idempotencia
 *   atómica para el audit trail del webhook).
 * - sin opciones → reemplaza el doc completo (semántica "set").
 * Soporta paths con subcolección (ej. `orders/{orderId}/events`).
 */
export async function fsSet(
  collection: string,
  id: string,
  data: Record<string, unknown>,
  opts?: { createOnly?: boolean; timestamps?: boolean; merge?: boolean }
): Promise<{ created: boolean }> {
  const ref = getAdminDb().doc(`${collection}/${id}`);
  const payload: Record<string, unknown> = { ...data };

  if (opts?.timestamps) {
    const now = Timestamp.now();
    if (!("createdAt" in payload)) payload.createdAt = now;
    payload.updatedAt = now;
  }

  if (opts?.createOnly) {
    try {
      await ref.create(payload);
      return { created: true };
    } catch (error) {
      // code 6 = ALREADY_EXISTS → no es error, es idempotencia.
      const code = (error as { code?: number }).code;
      if (code === 6) return { created: false };
      throw error;
    }
  }

  await ref.set(payload, opts?.merge ? { merge: true } : {});
  return { created: true };
}

/**
 * Actualiza campos de un documento preservando el resto (merge). Crea el doc si no existe
 * (equivalente al PATCH con updateMask de la implementación REST anterior).
 */
export async function fsUpdate(collection: string, id: string, data: Record<string, unknown>) {
  await getAdminDb().doc(`${collection}/${id}`).set(
    { ...data, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

export async function fsDelete(collection: string, id: string) {
  await getAdminDb().doc(`${collection}/${id}`).delete();
}

// ─── Auth: verificación de ID token vía Admin SDK ───
// El Admin SDK verifica la firma localmente contra las claves públicas de Google (cacheadas),
// así que no hay round-trip de red por request.

export async function verifyIdToken(
  idToken: string
): Promise<{ email: string; uid: string } | null> {
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return { email: decoded.email ?? "", uid: decoded.uid };
  } catch {
    return null;
  }
}

// ─── Auth: session cookies ───
// El cookie `__session` guarda un session cookie de Firebase (no el idToken crudo de 1h). Lo
// mintea el login a partir del idToken y dura varios días; el server lo valida en cada request.

/** Crea un session cookie de Firebase a partir de un idToken válido. `expiresInMs` ≤ 14 días. */
export async function createSessionCookie(
  idToken: string,
  expiresInMs: number
): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
}

/** Valida el session cookie. Devuelve el usuario o null si es inválido/vencido. */
export async function verifySession(
  sessionCookie: string
): Promise<{ email: string; uid: string } | null> {
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
    return { email: decoded.email ?? "", uid: decoded.uid };
  } catch {
    return null;
  }
}
