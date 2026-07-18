import { Skeleton } from "@/components/ui/skeleton";
import { HScroll } from "@/components/shell/Cards";

/**
 * Content-shaped loading placeholders. Screens show these instead of
 * full-screen spinners so navigation always lands on a stable layout.
 */

export function ProductCardSkeleton({ size = "sm" }: { size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-40" : "w-full";
  return (
    <div className={`shrink-0 ${w}`}>
      <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-3.5 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function ProductRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <HScroll>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </HScroll>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} size="md" />
      ))}
    </div>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-3 w-12 rounded" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div aria-hidden>
      <SectionHeaderSkeleton />
      <HScroll>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-24 shrink-0 rounded-3xl" />
        ))}
      </HScroll>
      <SectionHeaderSkeleton />
      <ProductRowSkeleton />
      <SectionHeaderSkeleton />
      <ProductRowSkeleton />
    </div>
  );
}

export function ListRowsSkeleton({
  count = 5,
  rowClass = "h-24",
}: {
  count?: number;
  rowClass?: string;
}) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`w-full rounded-2xl ${rowClass}`} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-[4/3] w-full rounded-b-3xl" />
      <div className="space-y-3 px-4 pt-4">
        <Skeleton className="h-6 w-2/3 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-16 w-24 rounded-2xl" />
          <Skeleton className="h-16 w-24 rounded-2xl" />
          <Skeleton className="h-16 w-24 rounded-2xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-3 pt-2" aria-hidden>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}
