"use client";

import { Button } from "@/components/ui/Button";
import { IconSignature, IconX } from "@tabler/icons-react";
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
    <div className="rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/8 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <IconSignature size={20} className="text-[var(--color-gold)]" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-[var(--color-ink)] text-base">
              חזק את המכתב שלך עם חתימת עורך דין
            </h3>
            <span className="text-xs font-bold text-[var(--color-gold)] bg-[var(--color-gold)]/15 rounded-full px-2.5 py-0.5 whitespace-nowrap">
              {SIGNATURE_PRICE} ש״ח בלבד
            </span>
          </div>
          <p className="text-sm text-[var(--color-body)] leading-relaxed">
            {upsellMessage}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="gold"
          onClick={onAccept}
          isLoading={isLoading}
          className="flex-1"
        >
          <IconSignature size={18} />
          הוסף חתימת עו&quot;ד בלבד {SIGNATURE_PRICE} ש&quot;ח
        </Button>
        <Button
          variant="ghost"
          onClick={onDecline}
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          <IconX size={16} />
          לא תודה
        </Button>
      </div>
    </div>
  );
}
