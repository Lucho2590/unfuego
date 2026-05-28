"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${productName}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Producto eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
