"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, Mail } from "lucide-react";

interface InvitedAdmin {
  id: string;
  email: string;
  invitedAt: string;
  status: "pending" | "accepted";
}

export default function InvitarAdminsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<InvitedAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/invitations");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar invitación");
      }

      toast.success(`Invitación enviada a ${email}`);
      setEmail("");
      fetchAdmins();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al enviar invitación"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, adminEmail: string) => {
    if (!confirm(`¿Eliminar acceso de ${adminEmail}?`)) return;

    try {
      const res = await fetch(`/api/admin/invitations?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Administrador eliminado");
      fetchAdmins();
    } catch {
      toast.error("Error al eliminar administrador");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-light">Invitar administradores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enviá una invitación por email para dar acceso al panel de admin.
        </p>
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="email">Email del nuevo administrador</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nuevo@admin.com"
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          <UserPlus className="w-4 h-4 mr-2" />
          {loading ? "Enviando..." : "Invitar"}
        </Button>
      </form>

      {/* Admins list */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-medium">Administradores</h2>
        </div>
        <div className="divide-y divide-border">
          {loadingAdmins ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Cargando...
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No hay administradores invitados
            </div>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{admin.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invitado:{" "}
                      {new Date(admin.invitedAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      admin.status === "accepted" ? "default" : "outline"
                    }
                  >
                    {admin.status === "accepted" ? "Activo" : "Pendiente"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(admin.id, admin.email)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
