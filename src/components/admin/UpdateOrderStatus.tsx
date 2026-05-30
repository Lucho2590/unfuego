"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const currentIndex = statusFlow.indexOf(currentStatus);
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1
    ? statusFlow[currentIndex + 1]
    : null;

  const isShipping = nextStatus === "shipped";
  const trackingReady = trackingNumber.trim() !== "" && trackingUrl.trim() !== "";

  const handleUpdate = async (status: OrderStatus) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { orderId, status };
      if (status === "shipped") {
        body.tracking = { number: trackingNumber.trim(), url: trackingUrl.trim() };
      }

      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar");
      }

      toast.success(`Estado actualizado a ${statusLabels[status]}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-medium">Actualizar estado</h2>

      {/* Datos de despacho: requeridos para marcar como enviado */}
      {isShipping && (
        <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Para despachar, cargá el número de guía y el link de seguimiento.
          </p>
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Número de guía</Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Ej: 123456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackingUrl">Link de seguimiento</Label>
            <Input
              id="trackingUrl"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {nextStatus && (
          <Button
            onClick={() => handleUpdate(nextStatus)}
            disabled={loading || (isShipping && !trackingReady)}
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
