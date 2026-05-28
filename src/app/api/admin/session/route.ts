import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, fsQuery, fsUpdate } from "@/lib/firebase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const user = await verifyIdToken(idToken);
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Check if email is in the env admin list
    const isEnvAdmin = ADMIN_EMAILS.includes(user.email);

    // Check if email was invited via admin_invitations
    let isInvitedAdmin = false;
    if (!isEnvAdmin) {
      try {
        const invitations = await fsQuery("admin_invitations", [
          { field: "email", op: "EQUAL", value: user.email },
        ]);
        if (invitations.length > 0) {
          isInvitedAdmin = true;
          // Mark invitation as accepted
          const invitation = invitations[0] as { id: string; status: string };
          if (invitation.status !== "accepted") {
            await fsUpdate("admin_invitations", invitation.id, {
              status: "accepted",
            });
          }
        }
      } catch {
        // If query fails, just check env list
      }
    }

    if (!isEnvAdmin && !isInvitedAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set("__session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Error al crear sesión" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  return NextResponse.json({ success: true });
}
