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
import { toast } from "sonner";
import type { Product, Section } from "@/lib/types";

// Valor centinela para "Sin sección" (radix Select no permite item con value="").
const NO_SECTION = "__none__";
// Idem para "Sin descuento".
const NO_DISCOUNT = "__none__";

interface ProductFormProps {
  product?: Product;
  sections?: Section[];
}

export function ProductForm({ product, sections = [] }: ProductFormProps) {
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
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        sortOrder: form.sortOrder === "" ? null : Number(form.sortOrder),
        discountType: hasDiscount ? form.discountType : null,
        discountValue: hasDiscount ? Number(form.discountValue) : null,
        discountDescription: hasDiscount
          ? form.discountDescription.trim() || null
          : null,
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
