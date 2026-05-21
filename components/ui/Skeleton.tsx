import { clsx } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "rounded bg-[var(--color-muted)] skeleton-pulse",
        className
      )}
    />
  );
}

export function SkeletonLines({ lines = 3 }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--color-muted)] bg-white p-6 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <SkeletonLines lines={4} />
    </div>
  );
}
