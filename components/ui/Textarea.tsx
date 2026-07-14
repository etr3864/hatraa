"use client";

import { clsx } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
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
      <textarea
        id={inputId}
        className={clsx(
          "w-full rounded-md border-[1.5px] border-[var(--color-border)]",
          "px-3.5 py-3 text-base text-[var(--color-ink)] bg-white",
          "placeholder:text-[var(--color-placeholder)]",
          "focus:outline-none focus:border-[var(--color-primary)]",
          "transition-opacity duration-150 resize-none leading-relaxed",
          error && "border-[var(--color-error)] focus:border-[var(--color-error)]",
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
