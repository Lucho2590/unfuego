"use client";

import { useEffect } from "react";

interface ProductViewTrackerProps {
  productId: string;
  slug: string;
}

export function ProductViewTracker({ productId, slug }: ProductViewTrackerProps) {
  useEffect(() => {
    fetch("/api/analytics/product-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, slug }),
    }).catch(() => {}); // silent fail
  }, [productId, slug]);

  return null;
}
