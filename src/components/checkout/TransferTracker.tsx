"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle2, Circle, XCircle, Loader2, Lock } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase/config";
import { TransferReceiptUploader } from "./TransferReceiptUploader";
import type { PaymentStatus } from "@/lib/types";

interface Props {
  orderId: string;
  initialStatus?: PaymentStatus;
  initialHasReceipt: boolean;
  canUpload: boolean;
  token?: string;
}

type StepState = "done" | "current" | "pending";

export function TransferTracker({
  orderId,
  initialStatus,
  initialHasReceipt,
  canUpload,
  token,
}: Props) {
  const [status, setStatus] = useState<PaymentStatus>(initialStatus ?? "pending");
  const [hasReceipt, setHasReceipt] = useState(initialHasReceipt);

  // Suscripción en vivo al estado del pedido.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const ref = doc(getFirebaseDb(), "orders", orderId);
      unsub = onSnapshot(
        ref,
        (snap) => {
          const data = snap.data() as
            | { paymentStatus?: PaymentStatus; bankTransfer?: { receiptUrl?: string } }
            | undefined;
          if (!data) return;
          if (data.paymentStatus) setStatus(data.paymentStatus);
          setHasReceipt(!!data.bankTransfer?.receiptUrl);
        },
        () => {
          // sin snapshot, queda el estado inicial del server
        }
      );
    } catch {
      // Firestore cliente no disponible
    }
    return () => unsub?.();
  }, [orderId]);

  const rejected = status === "failed";
  const completed = status === "completed";
  const receiptDone = hasReceipt || status === "processing" || completed;

  const steps: { label: string; state: StepState }[] = [
    { label: "Pedido creado", state: "done" },
    {
      label: "Comprobante enviado",
      state: receiptDone ? "done" : "current",
    },
    {
      label: "Pago confirmado",
      state: completed ? "done" : receiptDone ? "current" : "pending",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Línea de tiempo */}
      <ol className="space-y-4">
        {steps.map((step, i) => {
          const isRejectedStep = rejected && i === 2;
          return (
            <li key={i} className="flex items-start gap-3">
              {isRejectedStep ? (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              ) : step.state === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : step.state === "current" ? (
                <Loader2 className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0 animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p
                  className={
                    step.state === "pending" && !isRejectedStep
                      ? "text-sm text-muted-foreground"
                      : "text-sm"
                  }
                >
                  {isRejectedStep ? "Pago rechazado" : step.label}
                </p>
                {i === 1 && step.state === "current" && !rejected && (
                  <p className="text-xs text-muted-foreground">
                    Esperando que subas el comprobante.
                  </p>
                )}
                {i === 2 && step.state === "current" && !rejected && (
                  <p className="text-xs text-muted-foreground">
                    Estamos revisando tu comprobante.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Acción: subir comprobante */}
      {!rejected && !completed && (
        <div className="pt-2 border-t border-border">
          {hasReceipt ? (
            <p className="text-sm text-muted-foreground">
              Recibimos tu comprobante. Te confirmamos por email apenas validemos el pago.
            </p>
          ) : canUpload && token ? (
            <TransferReceiptUploader
              orderId={orderId}
              token={token}
              onUploaded={() => setHasReceipt(true)}
            />
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Para subir el comprobante, abrí el link que te enviamos por email. Ahí están
                también los datos para transferir.
              </p>
            </div>
          )}
        </div>
      )}

      {rejected && (
        <p className="text-sm text-muted-foreground">
          No pudimos validar tu transferencia. Te escribimos por email con los detalles.
        </p>
      )}
    </div>
  );
}
