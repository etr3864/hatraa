"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconFileText } from "@tabler/icons-react";
import {
  isPaidLetterResult,
  readStoredLetterResult,
  type StoredLetterResult,
} from "@/lib/letter-result";

export function ResumeLetterBanner() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredLetterResult | null>(null);

  useEffect(() => {
    setStored(readStoredLetterResult());
  }, []);

  if (!stored) return null;

  const paid = isPaidLetterResult(stored);

  return (
    <div className="mb-6 rounded-xl border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 px-4 py-3 flex items-start gap-3">
      <IconFileText
        size={20}
        className="mt-0.5 flex-shrink-0 text-[var(--color-accent)]"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-ink)] leading-relaxed">
          {paid
            ? "יש לך מכתב מאומת במכשיר — מומלץ לחזור ולהוריד אותו לפני שהוא ייעלם."
            : "יש לך מכתב מוכן שממתין להמשך. אפשר לחזור אליו ולהשלים את השדרוג או את ההורדה."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/result")}
          className="mt-2 text-sm font-semibold text-[var(--color-accent)] hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer p-0"
        >
          {paid ? "חזרה להורדת המכתב" : "חזרה למכתב"}
        </button>
      </div>
    </div>
  );
}
