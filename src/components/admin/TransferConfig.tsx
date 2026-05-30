"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import type { TransferSettings } from "@/lib/types";

const EMPTY: TransferSettings = {
  enabled: false,
  discountPercent: 0,
  bank: "",
  titular: "",
  cbu: "",
  alias: "",
  cuit: "",
  instructions: "",
};

export function TransferConfig() {
  const [settings, setSettings] = useState<TransferSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/transfer");
        if (res.ok) setSettings({ ...EMPTY, ...(await res.json()) });
      } catch {
        toast.error("Error al cargar la configuración de transferencia");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = <K extends keyof TransferSettings>(key: K, value: TransferSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // CBU: solo dígitos, máximo 22.
  const handleCbuChange = (value: string) => {
    update("cbu", value.replace(/\D/g, "").slice(0, 22));
  };

  // CUIT/CUIL: solo dígitos (máx 11), formateado como XX-XXXXXXXX-X mientras se escribe.
  const handleCuitChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length > 10) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
    }
    update("cuit", formatted);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/transfer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setSettings({ ...EMPTY, ...data.settings });
      toast.success("Configuración de transferencia guardada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">Cargando...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Landmark className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-light">Transferencia bancaria</h2>
        <Badge variant={settings.enabled ? "default" : "outline"}>
          {settings.enabled ? "Habilitada" : "Deshabilitada"}
        </Badge>
      </div>

      {/* Toggle habilitado */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={settings.enabled ? "default" : "outline"}
          size="sm"
          onClick={() => update("enabled", !settings.enabled)}
        >
          {settings.enabled ? "Habilitada" : "Habilitar"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Si está habilitada, aparece como opción de pago en el checkout.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Descuento (%)</Label>
          <Input
            id="discountPercent"
            type="number"
            min={0}
            max={100}
            value={settings.discountPercent}
            onChange={(e) => update("discountPercent", Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank">Banco</Label>
          <Input
            id="bank"
            value={settings.bank}
            onChange={(e) => update("bank", e.target.value)}
            placeholder="Banco Nación"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="titular">Titular</Label>
          <Input
            id="titular"
            value={settings.titular}
            onChange={(e) => update("titular", e.target.value)}
            placeholder="Nombre del titular"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cuit">CUIT / CUIL</Label>
          <Input
            id="cuit"
            value={settings.cuit}
            onChange={(e) => handleCuitChange(e.target.value)}
            placeholder="20-12345678-9"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbu">CBU</Label>
          <Input
            id="cbu"
            value={settings.cbu}
            onChange={(e) => handleCbuChange(e.target.value)}
            placeholder="22 dígitos"
            inputMode="numeric"
          />
          {settings.cbu.length > 0 && settings.cbu.length < 22 && (
            <p className="text-xs text-yellow-600">
              {settings.cbu.length}/22 dígitos
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="alias">Alias</Label>
          <Input
            id="alias"
            value={settings.alias}
            onChange={(e) => update("alias", e.target.value)}
            placeholder="mi.alias.mp"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instrucciones (opcional)</Label>
        <Textarea
          id="instructions"
          value={settings.instructions}
          onChange={(e) => update("instructions", e.target.value)}
          placeholder="Ej: enviá el comprobante por acá; el pedido se prepara al confirmar el pago."
          rows={3}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Guardando..." : "Guardar transferencia"}
      </Button>
    </div>
  );
}
