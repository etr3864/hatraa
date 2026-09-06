interface WizardWaitingProps {
  title: string;
  subtitle: string;
  progress?: number;
}

export function WizardWaiting({ title, subtitle, progress }: WizardWaitingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] gap-8 px-4">
      <div className="relative">
        <div className="absolute -inset-10 rounded-full bg-[var(--color-accent)]/[0.07] blur-[40px] pointer-events-none" />
        <div className="wizard-waiting-paper" aria-hidden>
          <div className="wizard-waiting-ink" />
        </div>
      </div>

      <div className="text-center max-w-xs">
        <p className="text-base font-medium text-[var(--color-ink)] leading-relaxed mb-2">
          {title}
        </p>
        <p className="text-sm text-[var(--color-subtle)]">{subtitle}</p>
      </div>

      {typeof progress === "number" ? (
        <div className="w-44 h-[2px] rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
