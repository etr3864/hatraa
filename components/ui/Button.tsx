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
    "ui-btn ui-btn-primary bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold",
  gold:
    "ui-btn ui-btn-primary bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold",
  ghost:
    "ui-btn ui-btn-ghost bg-white/[0.04] backdrop-blur-md border border-white/[0.08] text-[var(--color-body)]",
  subtle:
    "ui-btn ui-btn-subtle bg-white/[0.03] backdrop-blur-sm text-[var(--color-body)]",
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
        "rounded-full px-8 py-3.5 text-base font-medium",
        "transition-all duration-300 ease-out cursor-pointer",
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
