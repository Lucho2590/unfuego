import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { verifySession, fsAdd, fsUpdate, fsDelete } from "@/lib/firebase/admin";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session?.value) return false;
  const user = await verifySession(session.value);
  return !!user;
}

function parseSortOrder(value: unknown): number | null {
  return value === null || value === undefined || value === ""
    ? null
    : Number(value);
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const docId = await fsAdd("sections", {
      name: body.name,
      slug: body.slug,
      sortOrder: parseSortOrder(body.sortOrder),
      isActive: body.isActive ?? true,
    });

    revalidateTag("sections", "max");
    return NextResponse.json({ id: docId });
  } catch (error) {
    console.error("Create section error:", error);
    return NextResponse.json({ error: "Error al crear sección" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await fsUpdate("sections", id, {
      ...data,
      sortOrder: parseSortOrder(data.sortOrder),
    });

    revalidateTag("sections", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update section error:", error);
    return NextResponse.json({ error: "Error al actualizar sección" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await fsDelete("sections", id);
    revalidateTag("sections", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete section error:", error);
    return NextResponse.json({ error: "Error al eliminar sección" }, { status: 500 });
  }
}
