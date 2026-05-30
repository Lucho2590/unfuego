"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onIdTokenChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/config";

/**
 * Mantiene la cookie de sesión (`__session`) fresca.
 *
 * El ID token de Firebase expira a la hora, pero la cookie dura 5 días. Firebase refresca
 * el token internamente (~cada hora) y dispara `onIdTokenChanged`; cada vez reescribimos la
 * cookie con el token nuevo vía /api/admin/session. Así el server siempre recibe un token
 * válido y deja de dar 401 a mitad de la sesión.
 *
 * Además gatea el primer render hasta renovar la cookie, para evitar un 401 transitorio en
 * las llamadas que las páginas hacen al montar.
 */
export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        // No hay sesión de Firebase en el cliente → al login.
        router.replace("/admin/login");
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
      } catch {
        // Si falla la renovación, dejamos pasar igual: las páginas mostrarán su propio error.
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Verificando sesión...</span>
      </div>
    );
  }

  return <>{children}</>;
}
