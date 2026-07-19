export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <div className="aspect-[4/3] w-full animate-pulse bg-neutral-100 dark:bg-neutral-800" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-3 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
