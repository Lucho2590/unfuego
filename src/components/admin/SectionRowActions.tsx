"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SectionRowActionsProps {
  sectionId: string;
  sectionName: string;
}

export function SectionRowActions({
  sectionId,
  sectionName,
}: SectionRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Eliminar la sección "${sectionName}"? Los productos asignados quedarán sin sección.`
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sections?id=${sectionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Sección eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar sección");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={loading}
          aria-label="Acciones"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/secciones/${sectionId}`}>
            <Pencil className="w-4 h-4" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
          <Trash2 className="w-4 h-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
