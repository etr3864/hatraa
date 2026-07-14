"use client";

import { clsx } from "@/lib/utils";

type ButtonVariant = "primary" | "gold" | "ghost" | "subtle";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white font-semibold hover:opacity-85",
  gold:
    "bg-[var(--color-gold)] text-white font-semibold hover:opacity-85",
  ghost:
    "bg-transparent border-[1.5px] border-[var(--color-border)] text-[var(--color-body)] hover:opacity-85 hover:border-[var(--color-primary)]",
  subtle:
    "bg-[var(--color-muted)] text-[var(--color-primary)] hover:opacity-85",
};

export function Button({
  variant = "primary",
  isLoading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center gap-2",
        "rounded-lg px-8 py-3.5 text-base font-medium",
        "transition-opacity duration-150 cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantStyles[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingDots />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function LoadingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current skeleton-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}
