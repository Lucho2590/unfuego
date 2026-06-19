"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy,
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Mode = "test" | "production";

interface ModeInfo {
  configured: boolean;
  tokenMasked: string | null;
  source: "db" | "env" | null;
  hasWebhookSecret: boolean;
}

interface SettingsUI {
  activeMode: Mode;
  enabled: boolean;
  test: ModeInfo;
  production: ModeInfo;
  updatedAt?: string;
  updatedBy?: string;
}

type DraftCreds = { accessToken: string; webhookSecret: string };
const EMPTY_DRAFT: DraftCreds = { accessToken: "", webhookSecret: "" };

const MODE_LABEL: Record<Mode, string> = { test: "Pruebas", production: "Producción" };

export function MercadoPagoConfig() {
  const [settings, setSettings] = useState<SettingsUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [savingMode, setSavingMode] = useState<Mode | null>(null);
  const [drafts, setDrafts] = useState<Record<Mode, DraftCreds>>({
    test: { ...EMPTY_DRAFT },
    production: { ...EMPTY_DRAFT },
  });
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

  const updateDraft = (mode: Mode, key: keyof DraftCreds, value: string) => {
    setDrafts((prev) => ({ ...prev, [mode]: { ...prev[mode], [key]: value } }));
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;
    const next = !settings.enabled;
    setSavingEnabled(true);
    try {
      const res = await fetch("/api/admin/mercadopago", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setEnabled", enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar el estado");
      setSettings(data.settings);
      toast.success(next ? "MercadoPago habilitado" : "MercadoPago deshabilitado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar el estado");
    } finally {
      setSavingEnabled(false);
    }
  };

  const handleSetMode = async (activeMode: Mode) => {
    if (settings?.activeMode === activeMode) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mercadopago", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setMode", activeMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar el modo");
      setSettings(data.settings);
      toast.success(`Modo activo: ${MODE_LABEL[activeMode]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar el modo");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async (mode: Mode) => {
    const draft = drafts[mode];
    const accessToken = draft.accessToken.trim();
    const webhookSecret = draft.webhookSecret.trim();
    if (!accessToken && !webhookSecret) {
      toast.error("Ingresá al menos un valor para guardar.");
      return;
    }
    setSavingMode(mode);
    try {
      const res = await fetch("/api/admin/mercadopago", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveCredentials",
          mode,
          ...(accessToken ? { accessToken } : {}),
          ...(webhookSecret ? { webhookSecret } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar las credenciales");
      setSettings(data.settings);
      setDrafts((prev) => ({ ...prev, [mode]: { ...EMPTY_DRAFT } }));
      toast.success(`Credenciales de ${MODE_LABEL[mode]} guardadas`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSavingMode(null);
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

  return (
    <div className="space-y-8">
      {/* Encabezado + habilitar/deshabilitar */}
      <div className="flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-light">MercadoPago</h2>
        <Badge variant={settings?.enabled ? "default" : "outline"}>
          {settings?.enabled ? "Habilitado" : "Deshabilitado"}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={settings?.enabled ? "default" : "outline"}
          size="sm"
          disabled={savingEnabled}
          onClick={handleToggleEnabled}
        >
          {savingEnabled
            ? "Guardando..."
            : settings?.enabled
              ? "Deshabilitar"
              : "Habilitar"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Si está habilitado, aparece como opción de pago en el checkout.
        </span>
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
          evento <code>payment</code>. El secret resultante va en el campo &quot;Webhook
          secret&quot; de abajo.
        </p>
      </div>

      {/* Credenciales por modo */}
      <div className="border-t border-border pt-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Credenciales</h3>
          <p className="text-xs text-muted-foreground">
            Cargá el Access token de tu cuenta de MercadoPago (se guarda encriptado) o
            configuralo por variables de entorno. Elegí qué modo está activo en el checkout.
          </p>
        </div>

        {/* Toggle de modo */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Modo activo</p>
          <div className="flex gap-3">
            {(["test", "production"] as Mode[]).map((mode) => {
              const info = mode === "production" ? settings?.production : settings?.test;
              const isActive = settings?.activeMode === mode;
              return (
                <Button
                  key={mode}
                  variant={isActive ? "default" : "outline"}
                  disabled={saving || !info?.configured}
                  onClick={() => handleSetMode(mode)}
                  className="flex-1"
                >
                  {MODE_LABEL[mode]}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            No se puede activar un modo sin sus credenciales configuradas.
          </p>
        </div>

        {/* Credenciales por modo */}
        <div className="space-y-4">
          {(["test", "production"] as Mode[]).map((mode) => {
            const info = mode === "production" ? settings?.production : settings?.test;
            const draft = drafts[mode];
            return (
              <div
                key={mode}
                className="rounded-lg border border-border bg-card p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{MODE_LABEL[mode]}</h3>
                  {info?.configured ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {info.source === "env" ? "Variable de entorno" : "Cargado en la app"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <AlertCircle className="w-3.5 h-3.5" /> No configurado
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`token-${mode}`}>Access token</Label>
                  <Input
                    id={`token-${mode}`}
                    type="password"
                    autoComplete="off"
                    value={draft.accessToken}
                    onChange={(e) => updateDraft(mode, "accessToken", e.target.value)}
                    placeholder={info?.tokenMasked ?? "APP_USR-..."}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`secret-${mode}`}>Webhook secret</Label>
                  <Input
                    id={`secret-${mode}`}
                    type="password"
                    autoComplete="off"
                    value={draft.webhookSecret}
                    onChange={(e) => updateDraft(mode, "webhookSecret", e.target.value)}
                    placeholder={
                      info?.hasWebhookSecret ? "•••• (configurado)" : "Webhook secret"
                    }
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => handleSaveCredentials(mode)}
                  disabled={
                    savingMode === mode ||
                    (!draft.accessToken.trim() && !draft.webhookSecret.trim())
                  }
                >
                  {savingMode === mode ? "Guardando..." : "Guardar credenciales"}
                </Button>
              </div>
            );
          })}
        </div>
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
    </div>
  );
}
