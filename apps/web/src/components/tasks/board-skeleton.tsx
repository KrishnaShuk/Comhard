import { Skeleton } from "@/components/ui/skeleton";

export function BoardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((column) => (
        <div key={column} className="space-y-2 p-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}
