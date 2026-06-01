import Link from "next/link";
import { getAllSections } from "@/lib/firebase/sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { SectionRowActions } from "@/components/admin/SectionRowActions";

export const dynamic = "force-dynamic";

export default async function AdminSeccionesPage() {
  const sections = await getAllSections();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light">Secciones</h1>
        <Button asChild>
          <Link href="/admin/secciones/nuevo">
            <Plus className="w-4 h-4 mr-2" />
            Nueva sección
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="divide-y divide-border">
          {sections.map((section) => (
            <div
              key={section.id}
              className="relative p-4 flex items-center justify-between transition-colors hover:bg-muted/50"
            >
              {/* Overlay que hace clickeable toda la fila hacia la edición */}
              <Link
                href={`/admin/secciones/${section.id}`}
                className="absolute inset-0"
                aria-label={`Editar ${section.name}`}
              />
              <div>
                <p className="text-sm font-medium">{section.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{section.slug} — Orden: {section.sortOrder ?? "—"}
                </p>
              </div>
              {/* relative z-10 para quedar por encima del overlay y ser interactivo */}
              <div className="relative z-10 flex items-center gap-3">
                <Badge variant={section.isActive ? "default" : "secondary"}>
                  {section.isActive ? "Activa" : "Inactiva"}
                </Badge>
                <SectionRowActions
                  sectionId={section.id}
                  sectionName={section.name}
                />
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No hay secciones. Creá la primera.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
