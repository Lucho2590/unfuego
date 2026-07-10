"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  email: string;
}

/** Config por proveedor: webmail (desktop) y esquema de app (mobile). */
const PROVIDERS: Record<string, { webmail: string; app?: string }> = {
  gmail: { webmail: "https://mail.google.com/mail/u/0/#inbox", app: "googlegmail://" },
  outlook: { webmail: "https://outlook.live.com/mail/", app: "ms-outlook://" },
  yahoo: { webmail: "https://mail.yahoo.com/", app: "ymail://" },
  icloud: { webmail: "https://www.icloud.com/mail", app: "message://" },
};

/**
 * Mapea un dominio de email a un proveedor conocido. Para dominios no reconocidos
 * (típicamente empresas en Google Workspace) usamos Gmail como fallback razonable.
 */
function providerForDomain(domain: string): keyof typeof PROVIDERS {
  const d = domain.toLowerCase();
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(d)) return "outlook";
  if (["yahoo.com", "yahoo.com.ar", "ymail.com"].includes(d)) return "yahoo";
  if (["icloud.com", "me.com", "mac.com"].includes(d)) return "icloud";
  return "gmail";
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function OpenMailButton({ email }: Props) {
  const domain = email.split("@")[1] ?? "";
  const key = providerForDomain(domain);
  const { webmail, app } = PROVIDERS[key];

  const handleClick = () => {
    if (isMobile() && app) {
      // Intentamos abrir la app; si no responde, caemos al webmail.
      const fallback = window.setTimeout(() => {
        window.location.href = webmail;
      }, 800);
      // Si la app abre, el navegador pasa a segundo plano y cancelamos el fallback.
      const cancel = () => window.clearTimeout(fallback);
      window.addEventListener("pagehide", cancel, { once: true });
      window.addEventListener("blur", cancel, { once: true });
      window.location.href = app;
    } else {
      window.open(webmail, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="w-full">
      <Mail className="w-4 h-4 mr-2" />
      Abrir mi correo
    </Button>
  );
}
