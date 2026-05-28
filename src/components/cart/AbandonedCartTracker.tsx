"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";

export function AbandonedCartTracker() {
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (items.length === 0) return;

      // Use sendBeacon for reliability on page close
      const data = JSON.stringify({ items });
      navigator.sendBeacon("/api/analytics/abandoned-cart", data);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items]);

  return null;
}
