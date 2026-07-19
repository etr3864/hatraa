"use client";

import { IconSignature } from "@tabler/icons-react";
import { attorneyShortLabel } from "@/lib/attorney";

interface AttorneyUpgradeOverlayProps {
  step: "pay" | "rewrite";
}

export function AttorneyUpgradeOverlay({ step }: AttorneyUpgradeOverlayProps) {
  const title =
    step === "pay" ? "מאשר תשלום..." : `מנסח מחדש בשם ${attorneyShortLabel()}`;
  const subtitle =
    step === "pay"
      ? "רגע אחד, מעביר לאישור"
      : "שומרים על העובדות והחוקים — משנים רק ללשון ייצוג";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attorney-upgrade-title"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-gold)]/35 bg-[var(--color-elevated)] px-6 py-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30">
          <IconSignature size={26} className="text-[var(--color-gold)]" />
        </div>

        <div className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-[var(--color-gold)]/25 border-t-[var(--color-gold)] animate-spin" />

        <h2
          id="attorney-upgrade-title"
          className="text-lg font-bold text-[var(--color-ink)] mb-2"
        >
          {title}
        </h2>
        <p className="text-sm text-[var(--color-body)] leading-relaxed">
          {subtitle}
        </p>
        <p className="mt-4 text-xs text-[var(--color-subtle)]">
          אפשר לסגור את העמוד. העיבוד ימשיך ברקע ויתחדש כשתחזור.
        </p>
      </div>
    </div>
  );
}
