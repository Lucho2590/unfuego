import { NextResponse } from "next/server";
import { fsGet, fsUpdate, fsAdd } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const { productId, slug } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    // Increment view count in product_views collection
    const existing = await fsGet("product_views", productId);

    if (existing) {
      const views = ((existing as Record<string, unknown>).views as number) ?? 0;
      await fsUpdate("product_views", productId, {
        views: views + 1,
        slug: slug ?? "",
        lastViewed: new Date().toISOString(),
      });
    } else {
      // Create new entry — use the productId as the document path
      // We need to use fsUpdate with full path since fsAdd generates IDs
      await fsAdd("product_views", {
        productId,
        slug: slug ?? "",
        views: 1,
        lastViewed: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product view tracking error:", error);
    return NextResponse.json({ success: true }); // Don't break UX on tracking errors
  }
}
