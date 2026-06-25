import Link from "next/link";
import { getAllProducts } from "@/lib/firebase/products";
import { getAllSections } from "@/lib/firebase/sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const [products, sections] = await Promise.all([
    getAllProducts(),
    getAllSections(),
  ]);
  const sectionName = new Map(sections.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light">Productos</h1>
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="divide-y divide-border">
          {products.map((product) => (
            <div
              key={product.id}
              className="relative p-4 flex items-center justify-between transition-colors hover:bg-muted/50"
            >
              {/* Overlay que hace clickeable toda la fila hacia el detalle/edición */}
              <Link
                href={`/admin/productos/${product.id}`}
                className="absolute inset-0"
                aria-label={`Editar ${product.name}`}
              />
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{product.slug} — Stock: {product.stock} — Orden:{" "}
                    {product.sortOrder ?? "—"} — Sección:{" "}
                    {sectionName.get(product.category) ?? "—"}
                  </p>
                </div>
              </div>
              {/* relative z-10 para quedar por encima del overlay y ser interactivo */}
              <div className="relative z-10 flex items-center gap-3">
                {product.comingSoon && (
                  <Badge variant="secondary">Próximamente</Badge>
                )}
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <span className="text-sm font-medium">
                  {formatCurrency(product.price)}
                </span>
                <ProductRowActions
                  productId={product.id}
                  productName={product.name}
                />
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No hay productos. Creá el primero.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
