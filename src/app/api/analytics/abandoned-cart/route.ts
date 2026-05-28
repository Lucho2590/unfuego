import { NextResponse } from "next/server";
import { fsAdd, fsQuery, fsDelete } from "@/lib/firebase/admin";
import type { CartItem } from "@/lib/types";

// Save abandoned cart
export async function POST(request: Request) {
  try {
    const { items, email } = await request.json() as {
      items: CartItem[];
      email?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await fsAdd("abandoned_carts", {
      items,
      email: email ?? null,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      recoveredAt: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Abandoned cart tracking error:", error);
    return NextResponse.json({ success: true });
  }
}

// Get abandoned carts (for admin dashboard)
export async function GET() {
  try {
    const carts = await fsQuery(
      "abandoned_carts",
      undefined,
      { field: "createdAt", direction: "DESCENDING" }
    );
    return NextResponse.json({ carts });
  } catch {
    return NextResponse.json({ carts: [] });
  }
}
