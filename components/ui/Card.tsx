import { clsx } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, selected, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-xl border p-6 transition-all duration-200",
        "bg-[var(--color-surface)]",
        selected
          ? "border-[var(--color-accent)] glow-accent"
          : "border-[var(--color-border)]",
        (hoverable || onClick) &&
          "cursor-pointer hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-elevated)]",
        className
      )}
    >
      {children}
    </div>
  );
}
