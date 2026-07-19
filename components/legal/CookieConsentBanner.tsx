"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(!readCookieConsent());
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    writeCookieConsent(true);
    setVisible(false);
  };

  const necessaryOnly = () => {
    writeCookieConsent(false);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-20 left-4 right-4 z-[90] md:bottom-4 md:left-auto md:right-4 md:max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]"
      dir="rtl"
    >
      <h2
        id="cookie-consent-title"
        className="text-base font-bold text-[var(--color-ink)] mb-2"
      >
        עוגיות ופרטיות
      </h2>
      <p
        id="cookie-consent-desc"
        className="text-sm text-[var(--color-body)] leading-relaxed mb-4"
      >
        אנחנו משתמשים בעוגיות הכרחיות לתפעול האתר, ובעוגיות אנליטיקה רק אם תאשרו.
        לפרטים ראו את{" "}
        <Link href="/privacy" className="text-[var(--color-accent)] underline">
          מדיניות הפרטיות
        </Link>
        .
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={acceptAll}
          className="flex-1 rounded-xl bg-[var(--color-accent)] text-black font-medium text-sm py-2.5 hover:opacity-90 transition-opacity"
        >
          אישור כולל
        </button>
        <button
          type="button"
          onClick={necessaryOnly}
          className="flex-1 rounded-xl border border-[var(--color-border)] text-[var(--color-ink)] text-sm py-2.5 hover:bg-white/[0.04] transition-colors"
        >
          הכרחיות בלבד
        </button>
      </div>
    </div>
  );
}
