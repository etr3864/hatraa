"use client";

import { Button } from "@/components/ui/Button";
import { IconSignature } from "@tabler/icons-react";
import { SIGNATURE_PRICE } from "@/lib/constants";

interface UpsellBlockProps {
  upsellMessage: string;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function UpsellBlock({
  upsellMessage,
  onAccept,
  onDecline,
  isLoading,
}: UpsellBlockProps) {
  return (
    <div className="rounded-xl border-2 border-[var(--color-gold)]/55 bg-gradient-to-b from-[var(--color-gold)]/14 to-[var(--color-gold)]/[0.04] p-5 md:p-6 shadow-[0_0_0_1px_rgba(201,168,76,0.08),0_12px_40px_-16px_rgba(201,168,76,0.35)]">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-[var(--color-gold)]/25 border border-[var(--color-gold)]/30 flex items-center justify-center flex-shrink-0">
          <IconSignature size={22} className="text-[var(--color-gold)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-extrabold text-[var(--color-ink)] text-lg leading-tight">
              שדרג עם חתימת עו״ד
            </h3>
            <span className="text-xs font-bold text-[var(--color-bg)] bg-[var(--color-gold)] rounded-full px-2.5 py-0.5 whitespace-nowrap">
              {SIGNATURE_PRICE} ש״ח
            </span>
          </div>
          <p className="text-[15px] text-[var(--color-ink)]/85 leading-snug">
            {upsellMessage}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button
          variant="gold"
          onClick={onAccept}
          isLoading={isLoading}
          className="w-full text-base py-4 shadow-[0_8px_28px_-8px_rgba(201,168,76,0.55)]"
        >
          <IconSignature size={18} />
          שדרג עכשיו · {SIGNATURE_PRICE} ש״ח
        </Button>
        <button
          type="button"
          onClick={onDecline}
          disabled={isLoading}
          className="text-sm text-[var(--color-subtle)] hover:text-[var(--color-body)] transition-colors bg-transparent border-0 cursor-pointer py-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          המשך בלי חתימה
        </button>
      </div>
    </div>
  );
}
