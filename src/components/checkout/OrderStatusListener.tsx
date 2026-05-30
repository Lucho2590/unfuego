"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFirebaseDb } from "@/lib/firebase/config";
import { useCartStore } from "@/lib/store/cart";

type View = "approved" | "pending" | "rejected" | "unknown";

interface Props {
  orderId?: string;
  /** Estado inicial inferido del query param de MercadoPago (status). */
  initialStatus?: string;
}

/** Normaliza estados (de MP, de paymentStatus o de status legacy) a una vista. */
function toView(value: string | undefined | null): View {
  switch (value) {
    case "approved":
    case "completed":
      return "approved";
    case "rejected":
    case "failed":
    case "failure":
    case "cancelled":
      return "rejected";
    case "pending":
    case "processing":
    case "in_process":
      return "pending";
    default:
      return "unknown";
  }
}

const RESOLVED: View[] = ["approved", "rejected"];

export function OrderStatusListener({ orderId, initialStatus }: Props) {
  const [view, setView] = useState<View>(toView(initialStatus));
  const clearCart = useCartStore((s) => s.clearCart);
  const clearedRef = useRef(false);

  // Limpiar el carrito una sola vez al aprobarse.
  useEffect(() => {
    if (view === "approved" && !clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [view, clearCart]);

  // Suscripción en tiempo real al doc de la orden.
  useEffect(() => {
    if (!orderId) return;
    let unsub: (() => void) | undefined;
    try {
      const ref = doc(getFirebaseDb(), "orders", orderId);
      unsub = onSnapshot(
        ref,
        (snap) => {
          const data = snap.data() as
            | { paymentStatus?: string; status?: string }
            | undefined;
          if (!data) return;
          const next = toView(data.paymentStatus ?? data.status);
          if (next !== "unknown") setView(next);
        },
        () => {
          // Errores de permisos/red: el polling de respaldo se encarga.
        }
      );
    } catch {
      // Si Firestore cliente no está disponible, queda el polling.
    }
    return () => unsub?.();
  }, [orderId]);

  // Polling de respaldo mientras el estado no esté resuelto (por si el webhook se demora).
  useEffect(() => {
    if (!orderId || RESOLVED.includes(view)) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status?orderId=${orderId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { paymentStatus?: string; status?: string };
        if (!active) return;
        const next = toView(data.paymentStatus ?? data.status);
        if (next !== "unknown") setView(next);
      } catch {
        // ignorar; reintenta en el próximo tick
      }
    }, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orderId, view]);

  return (
    <div className="max-w-lg mx-auto text-center space-y-6">
      {view === "approved" && (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-display-md font-light">Pago confirmado</h1>
          <p className="text-muted-foreground">
            Tu pedido fue recibido correctamente. Te enviamos un email con los detalles.
          </p>
          {orderId && (
            <p className="text-sm text-muted-foreground">Referencia: {orderId}</p>
          )}
        </>
      )}

      {view === "pending" && (
        <>
          <Clock className="w-16 h-16 text-yellow-500 mx-auto" />
          <h1 className="text-display-md font-light">Pago en proceso</h1>
          <p className="text-muted-foreground">
            Tu pago está siendo procesado. Esta página se actualizará sola cuando se
            confirme.
          </p>
          <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
        </>
      )}

      {view === "rejected" && (
        <>
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-display-md font-light">Pago rechazado</h1>
          <p className="text-muted-foreground">
            No pudimos procesar tu pago. Intentá nuevamente o usá otro medio de pago.
          </p>
        </>
      )}

      {view === "unknown" && (
        <>
          <Clock className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-display-md font-light">Estado del pedido</h1>
          <p className="text-muted-foreground">
            Estamos verificando tu pago. Si lo realizaste, vas a recibir un email con la
            confirmación.
          </p>
          {orderId && (
            <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
          )}
        </>
      )}

      <div className="flex gap-4 justify-center pt-4">
        <Button asChild variant="outline">
          <Link href="/tienda">Seguir comprando</Link>
        </Button>
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
