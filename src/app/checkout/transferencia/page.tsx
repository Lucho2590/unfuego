import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/firebase/orders";
import { TransferTracker } from "@/components/checkout/TransferTracker";

export const metadata: Metadata = {
  title: "Tu pedido | Un Fuego",
};

interface Props {
  searchParams: Promise<{ order?: string; token?: string }>;
}

export default async function TransferenciaPage({ searchParams }: Props) {
  const { order: orderId, token } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : null;

  if (!order || order.paymentProvider !== "transfer") {
    return (
      <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="text-display-md font-light">Pedido no encontrado</h1>
          <p className="text-muted-foreground">
            No pudimos encontrar tu pedido por transferencia.
          </p>
          <Button asChild variant="outline">
            <Link href="/tienda">Ir a la tienda</Link>
          </Button>
        </div>
      </div>
    );
  }

  // El token solo viaja en el link del email: habilita subir el comprobante.
  const canUpload = !!token && token === order.bankTransfer?.accessToken;
  const hasReceipt = !!order.bankTransfer?.receiptUrl;

  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Landmark className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-display-md font-light">Pedido #{order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">
            Total a transferir:{" "}
            <span className="font-semibold text-foreground">
              ${order.total.toLocaleString("es-AR")}
            </span>
          </p>
        </div>

        {/* Aviso: los datos bancarios están en el email */}
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
          <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Te enviamos un email a <span className="text-foreground">{maskEmail(order.customer.email)}</span> con
            los datos para transferir. Revisá tu casilla (y el spam) si no lo ves.
          </p>
        </div>

        {/* Seguimiento del pedido */}
        <div className="rounded-lg border border-border bg-card p-5">
          <TransferTracker
            orderId={order.id}
            initialStatus={order.paymentStatus}
            initialHasReceipt={hasReceipt}
            canUpload={canUpload}
            token={canUpload ? token : undefined}
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

/** Enmascara el email para mostrarlo sin exponerlo del todo (ej. lu•••@gmail.com). */
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const shown = user.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
