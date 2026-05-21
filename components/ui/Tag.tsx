import { clsx } from "@/lib/utils";

type TagVariant = "category" | "status-success" | "status-pending" | "status-error";

interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  className?: string;
}

const variantStyles: Record<TagVariant, string> = {
  category:
    "border border-[var(--color-border)] text-[var(--color-primary)] bg-transparent",
  "status-success":
    "border border-[var(--color-success)] text-[var(--color-success)] bg-transparent",
  "status-pending":
    "border border-[var(--color-gold)] text-[var(--color-gold)] bg-transparent",
  "status-error":
    "border border-[var(--color-error)] text-[var(--color-error)] bg-transparent",
};

export function Tag({ children, variant = "category", className }: TagProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
