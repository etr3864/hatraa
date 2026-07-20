"use client";

import { Button } from "@/components/ui/Button";

interface LeaveLetterDialogProps {
  open: boolean;
  isPaid: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function LeaveLetterDialog({
  open,
  isPaid,
  onStay,
  onLeave,
}: LeaveLetterDialogProps) {
  if (!open) return null;

  const title = isPaid
    ? "לצאת בלי להוריד את המכתב?"
    : "לעזוב את עמוד המכתב?";

  const description = isPaid
    ? "המכתב המאומת לא נשמר במערכת. אם תצא עכשיו בלי להוריד אותו כקובץ PDF — לא תוכל לשחזר אותו. מומלץ להוריד לפני היציאה."
    : "המכתב עדיין שמור במכשיר שלך, וניתן לחזור אליו מהאשף. האם לצאת בכל זאת?";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onStay}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-letter-title"
        aria-describedby="leave-letter-desc"
        className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-sm w-full p-8 flex flex-col gap-4 scale-in"
      >
        <h3
          id="leave-letter-title"
          className="text-lg font-bold text-[var(--color-ink)]"
        >
          {title}
        </h3>
        <p
          id="leave-letter-desc"
          className="text-sm text-[var(--color-body)] leading-relaxed"
        >
          {description}
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="primary" className="flex-1" onClick={onStay}>
            {isPaid ? "להישאר ולהוריד" : "להישאר כאן"}
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onLeave}>
            {isPaid ? "בכל זאת לצאת" : "כן, לצאת"}
          </Button>
        </div>
      </div>
    </div>
  );
}
