"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, CreditCard, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { TransferConfig } from "@/components/admin/TransferConfig";

type Mode = "test" | "production";

interface ModeInfo {
  configured: boolean;
  tokenMasked: string | null;
}

interface SettingsUI {
  activeMode: Mode;
  test: ModeInfo;
  production: ModeInfo;
  updatedAt?: string;
  updatedBy?: string;
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<SettingsUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl] = useState(() =>
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/mercadopago`
      : ""
  );

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/mercadopago");
      if (res.ok) setSettings(await res.json());
      else toast.error("No se pudo cargar la configuración");
    } catch {
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSetMode = async (activeMode: Mode) => {
    if (settings?.activeMode === activeMode) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mercadopago", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar el modo");
      setSettings(data.settings);
      toast.success(
        `Modo activo: ${activeMode === "production" ? "Producción" : "Pruebas"}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar el modo");
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    toast.success("URL del webhook copiada");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
    );
  }

  const active = settings?.activeMode;
  const activeConfigured =
    active === "production" ? settings?.production.configured : settings?.test.configured;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-light">Configuración de pagos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Modo activo de MercadoPago. Los tokens se configuran como variables de entorno
          en el servidor (nunca se guardan ni se muestran completos acá).
        </p>
      </div>

      {/* Estado actual */}
      <div className="flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm">Estado:</span>
        {!activeConfigured ? (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600/40">
            Sin configurar
          </Badge>
        ) : (
          <Badge variant={active === "production" ? "default" : "outline"}>
            {active === "production" ? "Activo en Producción" : "Activo en Pruebas"}
          </Badge>
        )}
      </div>

      {/* Toggle de modo */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Modo activo</p>
        <div className="flex gap-3">
          {(["test", "production"] as Mode[]).map((mode) => {
            const info = mode === "production" ? settings?.production : settings?.test;
            const isActive = active === mode;
            return (
              <Button
                key={mode}
                variant={isActive ? "default" : "outline"}
                disabled={saving || !info?.configured}
                onClick={() => handleSetMode(mode)}
                className="flex-1"
              >
                {mode === "production" ? "Producción" : "Pruebas"}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          No se puede activar un modo sin sus credenciales configuradas.
        </p>
      </div>

      {/* Tarjetas de estado por modo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["test", "production"] as Mode[]).map((mode) => {
          const info = mode === "production" ? settings?.production : settings?.test;
          return (
            <div key={mode} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {mode === "production" ? "Producción" : "Pruebas"}
                </h3>
                {info?.configured ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configurado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertCircle className="w-3.5 h-3.5" /> No configurado
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {info?.tokenMasked ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                env: {mode === "production" ? "MP_PROD_*" : "MP_TEST_*"}
              </p>
            </div>
          );
        })}
      </div>

      {/* URL del webhook */}
      <div className="space-y-2">
        <p className="text-sm font-medium">URL del webhook</p>
        <div className="flex gap-2">
          <code className="flex-1 text-xs bg-muted rounded-md px-3 py-2 break-all">
            {webhookUrl}
          </code>
          <Button variant="outline" size="sm" onClick={copyWebhook}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Registrá esta URL en el panel de desarrolladores de MercadoPago suscribiendo el
          evento <code>payment</code>. Configurá el secret resultante en{" "}
          <code>MP_TEST_WEBHOOK_SECRET</code> / <code>MP_PROD_WEBHOOK_SECRET</code>.
        </p>
      </div>

      {/* Links útiles */}
      <div className="flex flex-col gap-2 text-sm">
        <a
          href="https://www.mercadopago.com.ar/developers/panel/app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-4 h-4" /> Panel de MercadoPago
        </a>
        <a
          href="https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-4 h-4" /> Tarjetas de prueba
        </a>
      </div>

      {settings?.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Última actualización: {new Date(settings.updatedAt).toLocaleString("es-AR")}
          {settings.updatedBy ? ` por ${settings.updatedBy}` : ""}
        </p>
      )}

      <TransferConfig />
    </div>
  );
}
