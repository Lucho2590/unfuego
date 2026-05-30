import Link from "next/link";
import { getAllProducts } from "@/lib/firebase/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const products = await getAllProducts();

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
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{product.slug} — Stock: {product.stock}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <span className="text-sm font-medium">
                  ${product.price.toLocaleString("es-AR")}
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/productos/${product.id}`}>Editar</Link>
                </Button>
                <DeleteProductButton productId={product.id} productName={product.name} />
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
