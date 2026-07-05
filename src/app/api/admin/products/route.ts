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

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const docId = await fsAdd("products", {
      name: body.name,
      slug: body.slug,
      description: body.description,
      shortDescription: body.shortDescription ?? "",
      price: Number(body.price),
      category: body.category ?? "",
      stock: Number(body.stock),
      isActive: body.isActive ?? true,
      comingSoon: body.comingSoon ?? false,
      images: body.images ?? [],
      manualUrl: body.manualUrl || null,
      sortOrder: body.sortOrder ?? null,
      discountType: body.discountType ?? null,
      discountValue:
        body.discountValue == null ? null : Number(body.discountValue),
      discountDescription: body.discountDescription ?? null,
    });

    revalidateTag("products", "max");
    return NextResponse.json({ id: docId });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await fsUpdate("products", id, {
      ...data,
      price: Number(data.price),
      stock: Number(data.stock),
      comingSoon: data.comingSoon ?? false,
      manualUrl: data.manualUrl || null,
      sortOrder:
        data.sortOrder === null || data.sortOrder === undefined
          ? null
          : Number(data.sortOrder),
      discountType: data.discountType ?? null,
      discountValue:
        data.discountValue == null ? null : Number(data.discountValue),
      discountDescription: data.discountDescription ?? null,
    });

    revalidateTag("products", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
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

    await fsDelete("products", id);
    revalidateTag("products", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
