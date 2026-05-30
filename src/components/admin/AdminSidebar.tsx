"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  UserPlus,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/invitar", label: "Invitar admins", icon: UserPlus },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/admin">
          <Logo size="sm" />
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Panel de administración</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-1 border-t border-border">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
        >
          <ExternalLink className="w-4 h-4" />
          Ir a la web
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
