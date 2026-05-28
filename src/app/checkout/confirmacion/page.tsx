import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Confirmación | Un Fuego",
};

interface Props {
  searchParams: Promise<{
    status?: string;
    external_reference?: string;
    payment_id?: string;
  }>;
}

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { status, external_reference } = await searchParams;

  const isApproved = status === "approved";
  const isPending = status === "pending" || status === "in_process";
  const isRejected = status === "rejected" || status === "failure";

  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <div className="max-w-lg mx-auto text-center space-y-6">
        {isApproved && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-display-md font-light">
              Pago confirmado
            </h1>
            <p className="text-muted-foreground">
              Tu pedido fue recibido correctamente. Te enviamos un email con los
              detalles.
            </p>
            {external_reference && (
              <p className="text-sm text-muted-foreground">
                Referencia: {external_reference}
              </p>
            )}
          </>
        )}

        {isPending && (
          <>
            <Clock className="w-16 h-16 text-yellow-500 mx-auto" />
            <h1 className="text-display-md font-light">
              Pago en proceso
            </h1>
            <p className="text-muted-foreground">
              Tu pago está siendo procesado. Te notificaremos por email cuando
              se confirme.
            </p>
          </>
        )}

        {isRejected && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-display-md font-light">
              Pago rechazado
            </h1>
            <p className="text-muted-foreground">
              No pudimos procesar tu pago. Intentá nuevamente o usá otro medio
              de pago.
            </p>
          </>
        )}

        {!isApproved && !isPending && !isRejected && (
          <>
            <h1 className="text-display-md font-light">
              Estado del pedido
            </h1>
            <p className="text-muted-foreground">
              Si realizaste un pago, vas a recibir un email con la confirmación.
            </p>
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
    </div>
  );
}
