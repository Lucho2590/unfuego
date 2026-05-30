"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCard, Landmark } from "lucide-react";
import { TransferConfig } from "@/components/admin/TransferConfig";
import { MercadoPagoConfig } from "@/components/admin/MercadoPagoConfig";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
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
