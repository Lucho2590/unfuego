import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getOrderById } from "@/lib/firebase/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpdateOrderStatus } from "@/components/admin/UpdateOrderStatus";
import { ReviewTransfer } from "@/components/admin/ReviewTransfer";
import { formatCurrency, formatPhone, telHref, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  shipped: "Enviado",
  delivered: "Entregado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light">
          Pedido {order.orderNumber}
        </h1>
        <Badge>{statusLabels[order.status] ?? order.status}</Badge>
      </div>

      {/* Customer */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-medium">Cliente</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{order.customer.name}</p>
          <p>
            <a href={`mailto:${order.customer.email}`} className="hover:underline">
              {order.customer.email}
            </a>
          </p>
          <p>
            <a href={telHref(order.customer.phone)} className="hover:underline">
              {formatPhone(order.customer.phone)}
            </a>
          </p>
        </div>
        {order.customer.phone && (
          <Button asChild variant="outline" size="sm">
            <a
              href={whatsappLink(
                order.customer.phone,
                `Hola ${order.customer.name}! Te escribimos de Un Fuego por tu pedido ${order.orderNumber} para coordinar la entrega.`
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar por WhatsApp
            </a>
          </Button>
        )}
      </div>

      {/* Shipping */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-medium">Envío</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{order.shipping.address}</p>
          {order.shipping.notes && <p>Notas: {order.shipping.notes}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-medium">Productos</h2>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item, i) => (
            <div key={i} className="p-4 flex justify-between">
              <div>
                <p className="text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  x{item.quantity} — {formatCurrency(item.price)} c/u
                </p>
              </div>
              <p className="text-sm font-medium">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {!!order.discount && order.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento</span>
              <span>−{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span>{formatCurrency(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium pt-1 border-t border-border">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* MercadoPago info */}
      {order.mercadopago?.paymentId && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium">MercadoPago</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Payment ID: {order.mercadopago.paymentId}</p>
            <p>Estado: {order.mercadopago.paymentStatus}</p>
          </div>
        </div>
      )}

      {/* Seguimiento del envío */}
      {order.tracking?.number && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-medium">Envío / seguimiento</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Guía: {order.tracking.number}</p>
            {order.tracking.url && (
              <a
                href={order.tracking.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {order.tracking.url}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Revisión de transferencia */}
      {order.paymentProvider === "transfer" && (
        <ReviewTransfer
          orderId={order.id}
          paymentStatus={order.paymentStatus}
          bankTransfer={order.bankTransfer}
        />
      )}

      {/* Update status */}
      <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
    </div>
  );
}
