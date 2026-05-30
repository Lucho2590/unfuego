"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import type { Order, PaymentStatus } from "@/lib/types";

interface Props {
  orderId: string;
  paymentStatus?: PaymentStatus;
  bankTransfer?: Order["bankTransfer"];
}

const statusLabel: Record<string, string> = {
  pending: "Esperando transferencia",
  processing: "Comprobante en revisión",
  completed: "Confirmada",
  failed: "Rechazada",
  refunded: "Reembolsada",
};

export function ReviewTransfer({ orderId, paymentStatus, bankTransfer }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const resolved = paymentStatus === "completed" || paymentStatus === "failed";

  const review = async (action: "confirm" | "reject") => {
    if (action === "reject" && !confirm("¿Rechazar esta transferencia?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/transfer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al revisar");
      }
      toast.success(action === "confirm" ? "Transferencia confirmada" : "Transferencia rechazada");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al revisar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Transferencia bancaria</h2>
        <Badge
          variant={
            paymentStatus === "completed"
              ? "default"
              : paymentStatus === "failed"
                ? "outline"
                : "outline"
          }
        >
          {statusLabel[paymentStatus ?? "pending"] ?? paymentStatus}
        </Badge>
      </div>

      {/* Comprobante */}
      {bankTransfer?.receiptUrl ? (
        <a
          href={bankTransfer.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <FileText className="w-4 h-4" /> Ver comprobante
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">
          El cliente todavía no subió el comprobante.
        </p>
      )}

      {bankTransfer?.reviewedBy && (
        <p className="text-xs text-muted-foreground">
          Revisada por {bankTransfer.reviewedBy}
          {bankTransfer.reviewedAt
            ? ` el ${new Date(bankTransfer.reviewedAt).toLocaleString("es-AR")}`
            : ""}
        </p>
      )}

      {!resolved && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => review("confirm")}
            disabled={loading}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar pago
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => review("reject")}
            disabled={loading}
            className="text-red-500"
          >
            <XCircle className="w-4 h-4 mr-1" /> Rechazar
          </Button>
        </div>
      )}
    </div>
  );
}
