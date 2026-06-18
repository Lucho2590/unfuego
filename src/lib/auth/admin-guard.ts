// Guard de admin reforzado para endpoints sensibles (configuración de pagos, integraciones).
// Además de validar el session cookie, chequea que el email esté autorizado (lista de env o
// invitación aceptada). Módulo server-only.
import { cookies } from "next/headers";
import { verifySession, fsQuery } from "@/lib/firebase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/**
 * Devuelve el email del admin autenticado, o null si no hay sesión válida / no está autorizado.
 * Autoriza si el email está en ADMIN_EMAILS o tiene una invitación en `admin_invitations`.
 */
export async function requireAdminEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session?.value) return null;

  const user = await verifySession(session.value);
  if (!user) return null;

  if (ADMIN_EMAILS.includes(user.email)) return user.email;

  try {
    const invitations = await fsQuery("admin_invitations", [
      { field: "email", op: "EQUAL", value: user.email },
    ]);
    if (invitations.length > 0) return user.email;
  } catch {
    // si la query falla, denegar
  }
  return null;
}
