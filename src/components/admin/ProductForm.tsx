"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
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
    isActive: product?.isActive ?? true,
    images: product?.images ?? [],
  });

  const updateField = (field: string, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    updateField("name", name);
    if (!isEditing) {
      updateField("slug", generateSlug(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
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
          <Input
            id="price"
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            required
            placeholder="25000"
          />
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
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            placeholder="parrillas"
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
      </div>

      <div className="space-y-2">
        <Label>Imágenes</Label>
        <ImageUploader
          productId={product?.id ?? "new"}
          images={form.images}
          onImagesChange={(images) => updateField("images", images)}
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
