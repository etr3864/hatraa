import { IconArrowRight } from "@tabler/icons-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { WizardStep } from "@/components/wizard/WizardStepContent";

const STEP_LABEL: Partial<Record<WizardStep, string>> = {
  input: "הסיפור",
  evidence: "ראיות",
  confirm: "פרטים",
  tone: "ניסוח",
  contact: "שולח",
};

interface WizardChromeProps {
  step: WizardStep;
  stepIndex: number;
  totalSteps: number;
  onHome: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function WizardChrome({
  step,
  stepIndex,
  totalSteps,
  onHome,
  onBack,
  onCancel,
}: WizardChromeProps) {
  const isBusy = step === "generating" || step === "extracting";
  const showBack = stepIndex > 0 && !isBusy;
  const label = STEP_LABEL[step];
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <header className="wizard-header fixed top-0 left-0 right-0 z-50 backdrop-blur-xl">
      <div className="max-w-xl mx-auto px-5 h-16 flex items-center gap-3">
        <div className="flex-1 flex justify-start min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="wizard-nav inline-flex items-center gap-1 text-sm text-[var(--color-body)] transition-colors"
            >
              <IconArrowRight size={15} />
              חזור
            </button>
          ) : null}
        </div>

        {isBusy ? (
          <BrandLogo size="letter" className="opacity-90 shrink-0" />
        ) : (
          <button
            type="button"
            onClick={onHome}
            className="header-brand cursor-pointer bg-transparent border-0 p-0 shrink-0"
            aria-label="חזרה לדף הבית"
          >
            <BrandLogo size="letter" className="opacity-90" />
          </button>
        )}

        <div className="flex-1 flex justify-end min-w-0">
          {step === "generating" ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-[var(--color-error)] hover:opacity-70 transition-opacity"
            >
              הפסק
            </button>
          ) : !isBusy && label ? (
            <span className="text-[11px] text-[var(--color-subtle)] tabular-nums">
              {stepIndex + 1}/{totalSteps}
            </span>
          ) : null}
        </div>
      </div>

      {!isBusy && stepIndex >= 0 ? (
        <div className="wizard-progress">
          <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <div className="wizard-progress" />
      )}
    </header>
  );
}
