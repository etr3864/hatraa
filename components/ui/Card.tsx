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
        "rounded-lg border-[0.5px] border-[var(--color-muted)] bg-white p-6 transition-opacity duration-150",
        selected && "border-[var(--color-primary)]",
        (hoverable || onClick) && "cursor-pointer hover:opacity-85",
        className
      )}
    >
      {children}
    </div>
  );
}
