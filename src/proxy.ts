import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Chequeo liviano de expiración del session cookie (JWT), apto para el edge runtime (no usa el
 * Admin SDK). Solo lee el claim `exp` para decidir el redirect; la verificación real de firma la
 * hacen los route handlers con `verifySession`.
 */
function isExpiredOrInvalid(cookie: string): boolean {
  try {
    const part = cookie.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part)) as { exp?: number };
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true; // no es un JWT decodificable → tratar como inválido
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (except login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = request.cookies.get("__session");

    // Sin cookie o con la sesión vencida/inválida → al login.
    if (!session?.value || isExpiredOrInvalid(session.value)) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
