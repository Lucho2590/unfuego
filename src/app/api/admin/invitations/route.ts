import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, fsAdd, fsQuery, fsDelete, fsUpdate } from "@/lib/firebase/admin";
import { resend } from "@/lib/resend";
import { AdminInvitationEmail } from "@/lib/email/templates/admin-invitation";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.unfuegomdq.com.ar";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session?.value) return false;
  const user = await verifyIdToken(session.value);
  return !!user;
}

// Generate a random password for the new user
function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const admins = await fsQuery("admin_invitations", undefined, {
      field: "invitedAt",
      direction: "DESCENDING",
    });
    return NextResponse.json({ admins });
  } catch {
    return NextResponse.json({ admins: [] });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Check if already invited
    const existing = await fsQuery("admin_invitations", [
      { field: "email", op: "EQUAL", value: email },
    ]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Este email ya fue invitado" },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth via REST API
    const tempPassword = generatePassword();

    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: tempPassword,
          returnSecureToken: false,
        }),
      }
    );

    if (!signUpRes.ok) {
      const err = await signUpRes.json();
      const message = err.error?.message;
      if (message === "EMAIL_EXISTS") {
        // User already exists in Firebase Auth, just save the invitation
      } else {
        throw new Error(message || "Error al crear usuario");
      }
    }

    // Save invitation record
    const invitationId = await fsAdd("admin_invitations", {
      email,
      status: "pending",
      invitedAt: new Date().toISOString(),
    });

    // Send invitation email
    if (resend) {
      try {
        // Generate a password reset link so the user can set their own password
        const resetRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestType: "PASSWORD_RESET",
              email,
            }),
          }
        );

        const loginUrl = `${BASE_URL}/admin/login`;

        await resend.emails.send({
          from: "Un Fuego <pedidos@unfuegomdq.com.ar>",
          to: email,
          subject: "Invitación al panel de administración - Un Fuego",
          react: AdminInvitationEmail({ email, loginUrl }),
        });
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
      }
    }

    return NextResponse.json({ success: true, id: invitationId });
  } catch (error) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al invitar" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await fsDelete("admin_invitations", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invitation error:", error);
    return NextResponse.json(
      { error: "Error al eliminar" },
      { status: 500 }
    );
  }
}
