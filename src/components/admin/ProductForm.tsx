"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "./ImageUploader";
import { PdfUploader } from "./PdfUploader";
import {
  slugify,
  formatThousands,
  onlyDigits,
  formatCurrency,
  getProductPrice,
} from "@/lib/utils";
import { applyPaymentAdjustment } from "@/lib/pricing";
import { toast } from "sonner";
import type {
  DiscountType,
  PaymentAdjustment,
  PaymentAdjustmentMode,
  Product,
  Section,
} from "@/lib/types";

// Valor centinela para "Sin sección" (radix Select no permite item con value="").
const NO_SECTION = "__none__";
// Idem para "Sin descuento".
const NO_DISCOUNT = "__none__";
// Idem para "Sin ajuste" en la config por medio de pago.
const NO_ADJUSTMENT = "__none__";

/** Arma el ajuste de un medio a partir de los campos planos del form. "" = sin ajuste. */
function buildAdjustment(
  mode: string,
  type: string,
  value: string,
  description: string
): PaymentAdjustment | null {
  if (type === "" || value === "") return null;
  return {
    mode: mode as PaymentAdjustmentMode,
    type: type as DiscountType,
    value: Number(value),
    description: description.trim() || null,
  };
}

interface ProductFormProps {
  product?: Product;
  sections?: Section[];
  /** Descuento global de transferencia (0-100), para avisar cuándo se usa de fallback. */
  transferDiscountPercent?: number;
}

interface AdjustmentFieldsProps {
  title: string;
  /** "mp" | "tr": prefijo de los campos planos del form. */
  idPrefix: string;
  mode: string;
  type: string;
  value: string;
  description: string;
  /** Precio final del producto (ya con su descuento propio). */
  basePrice: number;
  /** Qué pasa si este medio queda sin ajuste propio. */
  fallbackHint?: string;
  onChange: (field: string, value: string) => void;
}

/** Bloque de ajuste para un medio de pago. El select "Tipo" hace de interruptor. */
function PaymentAdjustmentFields({
  title,
  idPrefix,
  mode,
  type,
  value,
  description,
  basePrice,
  fallbackHint,
  onChange,
}: AdjustmentFieldsProps) {
  const off = type === "";
  const adjusted = off
    ? basePrice
    : applyPaymentAdjustment(
        basePrice,
        buildAdjustment(mode, type, value || "0", description)
      );
  const delta = adjusted - basePrice;
  const showPreview = !off && value !== "" && basePrice > 0;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}AdjType`}>Tipo</Label>
          <Select
            value={off ? NO_ADJUSTMENT : type}
            onValueChange={(v) =>
              onChange(`${idPrefix}AdjType`, v === NO_ADJUSTMENT ? "" : v)
            }
          >
            <SelectTrigger id={`${idPrefix}AdjType`} className="w-full">
              <SelectValue placeholder="Sin ajuste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ADJUSTMENT}>Sin ajuste</SelectItem>
              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
              <SelectItem value="fixed">Monto fijo ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}AdjMode`}>Modo</Label>
          <Select
            value={mode}
            onValueChange={(v) => onChange(`${idPrefix}AdjMode`, v)}
            disabled={off}
          >
            <SelectTrigger id={`${idPrefix}AdjMode`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="surcharge">Recargo (+)</SelectItem>
              <SelectItem value="discount">Descuento (−)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}AdjValue`}>Valor</Label>
          <Input
            id={`${idPrefix}AdjValue`}
            type="text"
            inputMode="numeric"
            value={type === "fixed" ? formatThousands(value) : value}
            onChange={(e) => onChange(`${idPrefix}AdjValue`, onlyDigits(e.target.value))}
            disabled={off}
            placeholder={type === "fixed" ? "5.000" : "10"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}AdjDescription`}>Descripción (opcional)</Label>
        <Input
          id={`${idPrefix}AdjDescription`}
          value={description}
          onChange={(e) => onChange(`${idPrefix}AdjDescription`, e.target.value)}
          disabled={off}
          placeholder="Recargo por financiación"
        />
      </div>

      {showPreview && (
        <p className="text-xs text-muted-foreground">
          Precio con {title}:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(adjusted)}
          </span>{" "}
          <span className={delta < 0 ? "text-green-600" : ""}>
            ({delta >= 0 ? "+" : "−"}
            {formatCurrency(Math.abs(delta))})
          </span>
        </p>
      )}

      {off && fallbackHint && (
        <p className="text-xs text-muted-foreground">{fallbackHint}</p>
      )}
    </div>
  );
}

export function ProductForm({
  product,
  sections = [],
  transferDiscountPercent = 0,
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!product;

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    price: product?.price?.toString() ?? "",
    category: product?.category ?? "",
    stock: product?.stock?.toString() ?? "0",
    sortOrder: product?.sortOrder?.toString() ?? "",
    discountType: product?.discountType ?? "", // "" | "percentage" | "fixed"
    discountValue: product?.discountValue?.toString() ?? "",
    discountDescription: product?.discountDescription ?? "",
    isActive: product?.isActive ?? true,
    comingSoon: product?.comingSoon ?? false,
    images: product?.images ?? [],
    manualUrl: product?.manualUrl ?? "",
    manualLabel: product?.manualLabel ?? "",
    // Ajustes por medio de pago: se guardan planos (todos string) para que `updateField`
    // siga sirviendo, y se arma el objeto anidado recién en handleSubmit.
    mpAdjType: product?.paymentAdjustments?.mercadopago?.type ?? "",
    mpAdjMode: product?.paymentAdjustments?.mercadopago?.mode ?? "surcharge",
    mpAdjValue: product?.paymentAdjustments?.mercadopago?.value?.toString() ?? "",
    mpAdjDescription: product?.paymentAdjustments?.mercadopago?.description ?? "",
    trAdjType: product?.paymentAdjustments?.transfer?.type ?? "",
    trAdjMode: product?.paymentAdjustments?.transfer?.mode ?? "discount",
    trAdjValue: product?.paymentAdjustments?.transfer?.value?.toString() ?? "",
    trAdjDescription: product?.paymentAdjustments?.transfer?.description ?? "",
  });

  const updateField = (field: string, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (name: string) => {
    updateField("name", name);
    if (!isEditing) {
      updateField("slug", slugify(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hasDiscount = form.discountType !== "" && form.discountValue !== "";

      // Los 8 campos planos de ajustes no van al doc: se sacan del spread y viajan
      // ya armados en `paymentAdjustments`. Si no, el PUT (que hace spread de data)
      // los escribiría como strings sueltos en cada producto.
      const {
        mpAdjType,
        mpAdjMode,
        mpAdjValue,
        mpAdjDescription,
        trAdjType,
        trAdjMode,
        trAdjValue,
        trAdjDescription,
        ...rest
      } = form;

      const body = {
        ...rest,
        price: Number(form.price),
        stock: Number(form.stock),
        sortOrder: form.sortOrder === "" ? null : Number(form.sortOrder),
        discountType: hasDiscount ? form.discountType : null,
        discountValue: hasDiscount ? Number(form.discountValue) : null,
        discountDescription: hasDiscount
          ? form.discountDescription.trim() || null
          : null,
        // Siempre las dos claves: Firestore mergea en profundidad, así que omitir una
        // dejaría vivo el ajuste anterior de ese medio en vez de borrarlo.
        paymentAdjustments: {
          mercadopago: buildAdjustment(mpAdjMode, mpAdjType, mpAdjValue, mpAdjDescription),
          transfer: buildAdjustment(trAdjMode, trAdjType, trAdjValue, trAdjDescription),
        },
        ...(isEditing ? { id: product.id } : {}),
      };

      const res = await fetch("/api/admin/products", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast.success(isEditing ? "Producto actualizado" : "Producto creado");
      router.push("/admin/productos");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar"
      );
    } finally {
      setLoading(false);
    }
  };

  // Precio final del producto (ya con su descuento propio): es la base sobre la que
  // se calcula el ajuste por medio de pago.
  const basePrice = getProductPrice({
    price: Number(form.price) || 0,
    discountType: (form.discountType || null) as DiscountType | null,
    discountValue: form.discountValue === "" ? null : Number(form.discountValue),
  }).final;

  const globalTransferHint =
    transferDiscountPercent > 0
      ? `Sin ajuste propio se aplica el descuento global de transferencia (−${transferDiscountPercent}%)` +
        (basePrice > 0
          ? `: ${formatCurrency(Math.round(basePrice * (1 - transferDiscountPercent / 100)))}`
          : ".")
      : "Sin ajuste propio se cobra el precio final, sin cambios.";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="Parrilla Portátil Un Fuego"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            required
            placeholder="parrilla-portatil"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shortDescription">Descripción corta</Label>
          <Input
            id="shortDescription"
            value={form.shortDescription}
            onChange={(e) => updateField("shortDescription", e.target.value)}
            placeholder="Para la card del producto"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción completa</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
            rows={4}
            placeholder="Descripción detallada del producto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio (ARS)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              $
            </span>
            <Input
              id="price"
              type="text"
              inputMode="numeric"
              className="pl-7"
              value={formatThousands(form.price)}
              onChange={(e) => updateField("price", onlyDigits(e.target.value))}
              required
              placeholder="25.000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => updateField("stock", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Sección</Label>
          <Select
            value={form.category === "" ? NO_SECTION : form.category}
            onValueChange={(value) =>
              updateField("category", value === NO_SECTION ? "" : value)
            }
          >
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Sin sección" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SECTION}>Sin sección</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                  {!section.isActive ? " (inactiva)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Orden</Label>
          <Input
            id="sortOrder"
            type="number"
            value={form.sortOrder}
            onChange={(e) => updateField("sortOrder", e.target.value)}
            placeholder="Menor aparece primero"
          />
        </div>

        <div className="flex items-center gap-2 self-end">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="isActive">Activo (visible en tienda)</Label>
        </div>

        <div className="flex items-center gap-2 self-end">
          <input
            type="checkbox"
            id="comingSoon"
            checked={form.comingSoon}
            onChange={(e) => updateField("comingSoon", e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="comingSoon">Próximamente (no se puede comprar)</Label>
        </div>
      </div>

      {/* Descuento manual (% o monto fijo) */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">Descuento</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discountType">Tipo</Label>
            <Select
              value={
                form.discountType === "" ? NO_DISCOUNT : form.discountType
              }
              onValueChange={(value) =>
                updateField(
                  "discountType",
                  value === NO_DISCOUNT ? "" : value
                )
              }
            >
              <SelectTrigger id="discountType" className="w-full">
                <SelectValue placeholder="Sin descuento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DISCOUNT}>Sin descuento</SelectItem>
                <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                <SelectItem value="fixed">Monto fijo ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountValue">Valor</Label>
            <Input
              id="discountValue"
              type="text"
              inputMode="numeric"
              value={
                form.discountType === "percentage"
                  ? form.discountValue
                  : formatThousands(form.discountValue)
              }
              onChange={(e) =>
                updateField("discountValue", onlyDigits(e.target.value))
              }
              disabled={form.discountType === ""}
              placeholder={
                form.discountType === "percentage" ? "20" : "5.000"
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountDescription">Descripción del descuento</Label>
          <Input
            id="discountDescription"
            value={form.discountDescription}
            onChange={(e) =>
              updateField("discountDescription", e.target.value)
            }
            disabled={form.discountType === ""}
            placeholder="Por día del padre"
          />
        </div>

        {form.discountType !== "" &&
          form.discountValue !== "" &&
          form.price !== "" && (
            <p className="text-xs text-muted-foreground">
              Precio final:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(
                  getProductPrice({
                    price: Number(form.price),
                    discountType: form.discountType as "percentage" | "fixed",
                    discountValue: Number(form.discountValue),
                  }).final
                )}
              </span>{" "}
              <span className="line-through">
                {formatCurrency(Number(form.price))}
              </span>
            </p>
          )}
      </div>

      {/* Configuración por medio de pago */}
      <div className="space-y-5 rounded-lg border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Configuración por medio de pago</p>
          <p className="text-xs text-muted-foreground">
            Se aplica sobre el precio final (después del descuento de arriba) y solo se
            ve en el checkout, al elegir el medio de pago.
          </p>
        </div>

        <PaymentAdjustmentFields
          title="MercadoPago"
          idPrefix="mp"
          mode={form.mpAdjMode}
          type={form.mpAdjType}
          value={form.mpAdjValue}
          description={form.mpAdjDescription}
          basePrice={basePrice}
          onChange={updateField}
        />

        <div className="border-t border-border" />

        <PaymentAdjustmentFields
          title="Transferencia"
          idPrefix="tr"
          mode={form.trAdjMode}
          type={form.trAdjType}
          value={form.trAdjValue}
          description={form.trAdjDescription}
          basePrice={basePrice}
          fallbackHint={globalTransferHint}
          onChange={updateField}
        />
      </div>

      <div className="space-y-2">
        <Label>Imágenes</Label>
        <ImageUploader
          productId={product?.id ?? "new"}
          images={form.images}
          onImagesChange={(images) => updateField("images", images)}
        />
      </div>

      <div className="space-y-2">
        <Label>Manual de armado (PDF)</Label>
        <PdfUploader
          productId={product?.id ?? "new"}
          manualUrl={form.manualUrl}
          onChange={(url) => updateField("manualUrl", url)}
        />
        <div className="space-y-2 pt-1">
          <Label htmlFor="manualLabel">Texto del botón de descarga</Label>
          <Input
            id="manualLabel"
            value={form.manualLabel}
            onChange={(e) => updateField("manualLabel", e.target.value)}
            placeholder="Descargar manual (PDF)"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear producto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
