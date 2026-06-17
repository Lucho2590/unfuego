"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCard, Landmark } from "lucide-react";
import { TransferConfig } from "@/components/admin/TransferConfig";
import { MercadoPagoConfig } from "@/components/admin/MercadoPagoConfig";

// Mensajes legibles para los códigos de error que devuelve el callback OAuth.
const OAUTH_ERROR_LABEL: Record<string, string> = {
  invalid_state: "La sesión de conexión expiró o es inválida. Probá de nuevo.",
  missing_code: "MercadoPago no devolvió el código de autorización.",
  missing_verifier: "No se encontró la sesión de conexión. Reiniciá el proceso.",
  exchange_failed: "MercadoPago rechazó el intercambio del código.",
  access_denied: "Cancelaste la autorización en MercadoPago.",
};

// Lee ?result del callback OAuth y muestra el toast correspondiente. Va en su propio componente
// para poder envolverlo en <Suspense> (requisito de useSearchParams en Next).
function OAuthResultToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    const result = searchParams.get("result");
    if (!result || handled.current) return;
    handled.current = true;

    if (result === "mp_oauth_connected") {
      toast.success("MercadoPago conectado correctamente");
    } else if (result === "mp_oauth_error") {
      const reason = searchParams.get("reason") ?? "";
      toast.error(OAUTH_ERROR_LABEL[reason] ?? "No se pudo conectar con MercadoPago");
    }

    // Limpia la URL para no re-disparar el toast al recargar.
    router.replace("/admin/configuracion-de-pagos");
  }, [searchParams, router]);

  return null;
}

export default function ConfiguracionPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Suspense fallback={null}>
        <OAuthResultToast />
      </Suspense>

      <div>
        <h1 className="text-2xl font-light">Configuración de pagos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurá los métodos de pago disponibles en el checkout.
        </p>
      </div>

      <Tabs defaultValue="transferencia">
        <TabsList className="w-full">
          <TabsTrigger value="transferencia">
            <Landmark className="w-4 h-4" /> Transferencia
          </TabsTrigger>
          <TabsTrigger value="mercadopago">
            <CreditCard className="w-4 h-4" /> MercadoPago
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transferencia" className="pt-6">
          <TransferConfig />
        </TabsContent>

        <TabsContent value="mercadopago" className="pt-6">
          <MercadoPagoConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
