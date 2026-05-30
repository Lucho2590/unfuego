"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSessionGuard } from "@/components/admin/AdminSessionGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <AdminSessionGuard>{children}</AdminSessionGuard>
      </main>
    </div>
  );
}
