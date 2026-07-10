"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle2, Circle, XCircle, Loader2 } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase/config";
import { TransferReceiptUploader } from "./TransferReceiptUploader";
import { OpenMailButton } from "./OpenMailButton";
import { maskEmail } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types";

interface Props {
  orderId: string;
  initialStatus?: PaymentStatus;
  initialHasReceipt: boolean;
  canUpload: boolean;
  token?: string;
  /** Email del cliente: muestra el paso "te enviamos los datos" + botón para abrir el correo. */
  email?: string;
  /** Modo simulación (page de test): no se suscribe a Firestore ni sube archivos reales. */
  simulate?: boolean;
}

type StepState = "done" | "current" | "pending";

interface Step {
  label: string;
  state: StepState;
  /** Subtexto que se muestra cuando el paso está en curso. */
  sub?: string;
  /** Muestra el aviso del mail + botón "Abrir mi correo". */
  mail?: boolean;
  /** Este paso pasa a "Pago rechazado" cuando el pago falla. */
  rejectable?: boolean;
}

export function TransferTracker({
  orderId,
  initialStatus,
  initialHasReceipt,
  canUpload,
  token,
  email,
  simulate,
}: Props) {
  const [status, setStatus] = useState<PaymentStatus>(initialStatus ?? "pending");
  const [hasReceipt, setHasReceipt] = useState(initialHasReceipt);

  // Suscripción en vivo al estado del pedido.
  useEffect(() => {
    if (simulate) return;
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
  }, [orderId, simulate]);

  const rejected = status === "failed";
  const completed = status === "completed";
  const receiptDone = hasReceipt || status === "processing" || completed;
  // El aviso + botón de "Abrir mi correo" solo tiene sentido en la primera pantalla,
  // antes de volver por el link del email (canUpload) o de subir el comprobante.
  const showMailCta = !canUpload && !receiptDone;

  // Los pasos se revelan progresivamente: la primera pantalla (sin volver del mail,
  // sin comprobante) muere en el paso del mail. El de subir el comprobante aparece al
  // volver por el link del email (canUpload); el de pago, recién con el comprobante enviado.
  const steps: Step[] = [
    { label: "Pedido creado", state: "done" },
    {
      label: "Te enviamos los datos para transferir a tu mail",
      state: "done",
      mail: true,
    },
  ];

  if (canUpload || receiptDone || rejected) {
    steps.push({
      label: receiptDone ? "Comprobante enviado" : "Esperando que subas el comprobante",
      state: receiptDone ? "done" : "current",
    });
  }

  if (receiptDone || rejected) {
    steps.push({
      label: "Pago confirmado",
      state: completed ? "done" : "current",
      sub: "Estamos esperando que el equipo valide la transferencia.",
      rejectable: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Línea de tiempo */}
      <ol className="space-y-4">
        {steps.map((step, i) => {
          const isRejectedStep = rejected && !!step.rejectable;
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
              <div className="flex-1">
                <p
                  className={
                    step.state === "pending" && !isRejectedStep
                      ? "text-sm text-muted-foreground"
                      : "text-sm"
                  }
                >
                  {isRejectedStep ? "Pago rechazado" : step.label}
                </p>
                {step.mail && !isRejectedStep && (
                  <div className="mt-1 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {email ? (
                        <>
                          Lo enviamos a{" "}
                          <span className="text-foreground">{maskEmail(email)}</span>.{" "}
                        </>
                      ) : null}
                      {showMailCta &&
                        "Revisá tu casilla y el spam. Desde ahí también subís el comprobante."}
                    </p>
                    {email && showMailCta && <OpenMailButton email={email} />}
                  </div>
                )}
                {step.sub && step.state === "current" && !isRejectedStep && (
                  <p className="text-xs text-muted-foreground">{step.sub}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Acción: subir comprobante. Sin token/comprobante (primera pantalla) no se
          muestra nada: el paso del mail + "Abrir mi correo" es el aviso. El uploader
          aparece al volver por el link del email (que trae el token). */}
      {!rejected && !completed && hasReceipt && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Recibimos tu comprobante. Estamos esperando que el equipo valide la
            transferencia; te confirmamos por email.
          </p>
        </div>
      )}

      {!rejected && !completed && !hasReceipt && canUpload && token && (
        <div className="pt-2 border-t border-border">
          <TransferReceiptUploader
            orderId={orderId}
            token={token}
            onUploaded={() => setHasReceipt(true)}
            simulate={simulate}
          />
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
