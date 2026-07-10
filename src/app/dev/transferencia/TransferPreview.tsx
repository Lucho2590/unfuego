"use client";

import { useState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransferTracker } from "@/components/checkout/TransferTracker";
import { formatCurrency } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types";

// Pedido ficticio para el preview (no toca Firestore).
const MOCK = {
  orderNumber: "UF-TEST",
  total: 250000,
  email: "cliente@gmail.com",
};

interface Stage {
  label: string;
  status: PaymentStatus;
  hasReceipt: boolean;
  canUpload: boolean;
}

// Etapas mapeadas a los estados reales del TransferTracker.
const STAGES: Stage[] = [
  // Primera pantalla: recién hecho el pedido, sin token → sin uploader.
  {
    label: "Pedido creado (mail enviado)",
    status: "pending",
    hasReceipt: false,
    canUpload: false,
  },
  // Volvió por el link del email (con token) → aparece el uploader.
  {
    label: "Volviste del mail",
    status: "pending",
    hasReceipt: false,
    canUpload: true,
  },
  {
    label: "Comprobante enviado / Esperando aprobación",
    status: "processing",
    hasReceipt: true,
    canUpload: true,
  },
  { label: "Pago confirmado", status: "completed", hasReceipt: true, canUpload: true },
  { label: "Pago rechazado", status: "failed", hasReceipt: true, canUpload: true },
];

export function TransferPreview() {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = STAGES[stageIndex];

  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Selector de etapa (solo test) */}
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-medium text-primary">
            Simulador de etapas (solo desarrollo)
          </p>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === stageIndex ? "default" : "outline"}
                onClick={() => setStageIndex(i)}
              >
                {i + 1}. {s.label.split(" / ")[0]}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Chrome espejo de /checkout/transferencia ── */}
        <div className="text-center space-y-2">
          <Landmark className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-display-md font-light">Pedido #{MOCK.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">
            Total a transferir:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(MOCK.total)}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <TransferTracker
            key={stageIndex}
            orderId="preview"
            initialStatus={stage.status}
            initialHasReceipt={stage.hasReceipt}
            canUpload={stage.canUpload}
            token="preview"
            email={MOCK.email}
            simulate
          />
        </div>

        <div className="text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/tienda">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
