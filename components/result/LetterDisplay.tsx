"use client";

import { clsx } from "@/lib/utils";

interface LetterDisplayProps {
  content: string;
  senderName: string;
  respondentName: string;
  withSignatureBlur: boolean;
}

export function LetterDisplay({
  content,
  senderName,
  respondentName,
  withSignatureBlur,
}: LetterDisplayProps) {
  const paragraphs = content
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0);

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-[var(--color-subtle)]">מכתב התראה</span>
        <span className="text-xs text-[var(--color-subtle)]">
          אל: {respondentName}
        </span>
      </div>

      <div className="p-6 md:p-8 font-[Heebo,sans-serif] text-sm leading-relaxed">
        <div className="flex justify-between text-xs text-[var(--color-subtle)] mb-6">
          <span>מאת: {senderName}</span>
          <span>
            {new Date().toLocaleDateString("he-IL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[var(--color-ink)] leading-relaxed text-[13px]"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {p}
            </p>
          ))}
        </div>

        <div
          className={clsx(
            "mt-8 pt-6 border-t border-[var(--color-border)]",
            withSignatureBlur && "blur-signature select-none"
          )}
        >
          <div className="flex flex-col gap-2">
            <div className="w-36 h-12 bg-[var(--color-muted)] rounded opacity-70 flex items-center justify-center">
              <span className="text-xs text-[var(--color-subtle)] font-medium">
                חתימת עו&quot;ד
              </span>
            </div>
            <p className="text-xs text-[var(--color-subtle)]">
              {withSignatureBlur ? "עו\"ד · מאומת ומאושר" : senderName}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-dashed border-[var(--color-border)]">
          <p className="text-[11px] text-[var(--color-placeholder)] leading-relaxed">
            מכתב זה נוצר באמצעות מערכת בינה מלאכותית (AI) ואינו מהווה ייעוץ משפטי.
            {withSignatureBlur
              ? " ניתן להוסיף חתימת עורך דין למכתב לקבלת תוקף משפטי מלא."
              : " מכתב זה נחתם על ידי עורך דין ומהווה מסמך משפטי תקף."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
