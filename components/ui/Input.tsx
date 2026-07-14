"use client";

import { clsx } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-body)]"
        >
          {label}
          {props.required && <span className="text-[var(--color-accent)] mr-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "w-full rounded-lg border border-[var(--color-border)]",
          "px-4 py-3 text-base text-[var(--color-ink)]",
          "placeholder:text-[var(--color-placeholder)]",
          "focus:outline-none focus:border-[var(--color-accent)]/60 focus:ring-1 focus:ring-[var(--color-accent)]/20",
          "transition-all duration-200",
          "bg-[var(--color-surface)]",
          error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
          className
        )}
        {...props}
      />
      {hint && !error && (
        <span className="text-xs text-[var(--color-subtle)]">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-[var(--color-error)]">{error}</span>
      )}
    </div>
  );
}
