"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/types";

interface UpdateOrderStatusProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusFlow: OrderStatus[] = [
  "pending",
  "approved",
  "shipped",
  "delivered",
];

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function UpdateOrderStatus({
  orderId,
  currentStatus,
}: UpdateOrderStatusProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentIndex = statusFlow.indexOf(currentStatus);
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1
    ? statusFlow[currentIndex + 1]
    : null;

  const handleUpdate = async (status: OrderStatus) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      if (!res.ok) throw new Error("Error al actualizar");

      toast.success(`Estado actualizado a ${statusLabels[status]}`);
      router.refresh();
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-medium">Actualizar estado</h2>
      <div className="flex gap-2">
        {nextStatus && (
          <Button
            onClick={() => handleUpdate(nextStatus)}
            disabled={loading}
            size="sm"
          >
            Marcar como {statusLabels[nextStatus]}
          </Button>
        )}
        {currentStatus !== "cancelled" && currentStatus !== "delivered" && (
          <Button
            onClick={() => handleUpdate("cancelled")}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-red-500"
          >
            Cancelar pedido
          </Button>
        )}
      </div>
    </div>
  );
}
