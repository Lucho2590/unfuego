"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import type { Section } from "@/lib/types";

interface SectionFormProps {
  section?: Section;
}

export function SectionForm({ section }: SectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!section;

  const [form, setForm] = useState({
    name: section?.name ?? "",
    slug: section?.slug ?? "",
    sortOrder: section?.sortOrder?.toString() ?? "",
    isActive: section?.isActive ?? true,
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      // El slug se autogenera del nombre salvo que se esté editando uno existente.
      slug: isEditing ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        sortOrder: form.sortOrder === "" ? null : Number(form.sortOrder),
        isActive: form.isActive,
        ...(isEditing ? { id: section.id } : {}),
      };

      const res = await fetch("/api/admin/sections", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast.success(isEditing ? "Sección actualizada" : "Sección creada");
      router.push("/admin/secciones");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
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
            placeholder="Parrillas"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            required
            placeholder="parrillas"
          />
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
          <Label htmlFor="isActive">Activa (visible en tienda)</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear sección"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
