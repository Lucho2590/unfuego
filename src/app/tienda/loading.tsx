import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT_GRID_CLASS } from "@/components/tienda/ProductGrid";

export default function TiendaLoading() {
  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-40 mx-auto mb-3" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2 overflow-hidden md:justify-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          <div className={PRODUCT_GRID_CLASS}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square rounded-xl" />
                <div className="pt-3 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
