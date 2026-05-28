"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

interface CartIconProps {
  onClick: () => void;
}

export function CartIcon({ onClick }: CartIconProps) {
  const itemCount = useCartStore((s) => s.getItemCount());
  const controls = useAnimationControls();
  const prevCount = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (itemCount > prevCount.current) {
      controls.start({
        scale: [1, 1.3, 0.95, 1],
        transition: { duration: 0.4, ease: "easeOut" },
      });
    }
    prevCount.current = itemCount;
  }, [itemCount, controls, mounted]);

  return (
    <motion.button
      animate={controls}
      onClick={onClick}
      className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Abrir carrito"
    >
      <ShoppingCart className="w-5 h-5" />
      {mounted && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </motion.button>
  );
}
