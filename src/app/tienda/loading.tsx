import { Skeleton } from "@/components/ui/skeleton";

export default function TiendaLoading() {
  return (
    <div className="pt-24 pb-16 px-[var(--section-padding-x)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-40 mx-auto mb-3" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/50 overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
