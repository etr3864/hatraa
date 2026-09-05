"use client";

import { useEffect, useState } from "react";
import { clsx } from "@/lib/utils";
import { attorneyShortLabel } from "@/lib/attorney";
import { sanitizeLetterContent } from "@/backend/services/ai/sanitize-letter-content";
import { SignatureTeaser } from "@/components/result/SignatureTeaser";

interface LetterDisplayProps {
  content: string;
  senderName: string;
  senderPhone?: string;
  senderEmail?: string;
  respondentName: string;
  withSignatureBlur: boolean;
  attorneyVerified?: boolean;
  leadId?: string;
}

export function LetterDisplay({
  content,
  senderName,
  senderPhone,
  senderEmail,
  respondentName,
  withSignatureBlur,
  attorneyVerified = false,
  leadId,
}: LetterDisplayProps) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!attorneyVerified || !leadId || leadId === "no-db") {
      setSignatureDataUrl(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/attorney-signature?leadId=${encodeURIComponent(leadId)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { signatureDataUrl?: string };
        return data.signatureDataUrl ?? null;
      })
      .then((url) => {
        if (!cancelled) setSignatureDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setSignatureDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [attorneyVerified, leadId]);

  const displayContent = sanitizeLetterContent(content, {
    senderName,
    senderPhone,
    senderEmail,
    attorneyVerified,
  });

  const paragraphs = displayContent
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0);

  const fromLabel = attorneyVerified
    ? `${attorneyShortLabel()} (בשם ${senderName})`
    : senderName;

  const disclaimer = (() => {
    if (withSignatureBlur) {
      return "מכתב זה נוצר באמצעות מערכת בינה מלאכותית (AI) ואינו מהווה ייעוץ משפטי. ניתן לשדרג למכתב בשם עו\"ד עם חתימה מאומתת.";
    }
    if (attorneyVerified) {
      return "מכתב זה נוצר באמצעות מערכת בינה מלאכותית (AI), נערך בלשון ייצוג ונחתם כמאומת. אינו מחליף ייעוץ משפטי פרטני.";
    }
    return "מכתב זה נוצר באמצעות מערכת בינה מלאכותית (AI) ואינו מהווה ייעוץ משפטי. לתביעות מורכבות מומלץ להתייעץ עם עורך דין.";
  })();

  const dateLabel = new Date().toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className={clsx(
        "letter-paper bg-[#fbfbfd] text-[#1a1a1a]",
        "rounded-sm md:rounded-md overflow-hidden",
        "border border-black/[0.06]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.45)]",
        "md:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_64px_-16px_rgba(0,0,0,0.55)]"
      )}
    >
      <div className="border-b border-zinc-200/90 bg-zinc-50/80 px-5 py-2.5 md:px-10 md:py-3 flex items-center justify-between gap-3">
        <span className="text-[11px] md:text-xs text-zinc-500 tracking-wide">
          מכתב התראה
        </span>
        <span className="text-[11px] md:text-xs text-zinc-500 truncate">
          אל: {respondentName}
        </span>
      </div>

      <div className="px-5 py-6 md:px-10 md:py-10 font-[Heebo,sans-serif]">
        <header className="flex flex-col-reverse gap-1 sm:flex-row sm:justify-between sm:items-start mb-7 md:mb-9 text-[12px] md:text-[13px] text-zinc-500">
          <span>
            <span className="text-zinc-400">מאת: </span>
            <span className="text-zinc-700 font-medium">{fromLabel}</span>
          </span>
          <span className="shrink-0">{dateLabel}</span>
        </header>

        <div className="flex flex-col gap-3.5 md:gap-4">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[#1c1c1f] leading-[1.75] text-[13.5px] md:text-[14.5px] text-justify"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {p}
            </p>
          ))}
        </div>

        {withSignatureBlur && (
          <div className="mt-6 md:mt-8 pt-4 border-t border-zinc-200/80">
            <SignatureTeaser />
          </div>
        )}

        {attorneyVerified && !withSignatureBlur && (
          <div className="mt-8 md:mt-10 pt-5 border-t border-zinc-200">
            <p className="text-[13.5px] md:text-[14.5px] font-bold text-[#1c1c1f] mb-3">
              בכבוד רב,
            </p>
            <div className="flex flex-col gap-2">
              {signatureDataUrl ? (
                <img
                  src={signatureDataUrl}
                  alt={`חתימת ${attorneyShortLabel()}`}
                  className="w-40 h-14 object-contain object-right"
                />
              ) : null}
              <p className="text-xs text-zinc-600 font-medium">
                {`${attorneyShortLabel()} · מאומת ומאושר`}
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 md:mt-8 pt-4 border-t border-dashed border-zinc-300">
          <p className="text-[10.5px] md:text-[11px] text-zinc-400 leading-relaxed">
            {disclaimer}
          </p>
        </div>
      </div>
    </article>
  );
}
