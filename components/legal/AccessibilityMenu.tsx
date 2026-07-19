"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  IconAccessible,
  IconContrast,
  IconLetterSpacing,
  IconLink,
  IconPlayerPause,
  IconTextSize,
  IconX,
} from "@tabler/icons-react";
import {
  applyA11yPreferences,
  DEFAULT_A11Y_PREFS,
  readA11yPreferences,
  writeA11yPreferences,
  type A11yFontSize,
  type A11yPreferences,
} from "@/lib/accessibility-prefs";

export function AccessibilityMenu() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPreferences>(DEFAULT_A11Y_PREFS);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = readA11yPreferences();
      setPrefs(current);
      applyA11yPreferences(current);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const update = (patch: Partial<A11yPreferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    writeA11yPreferences(next);
  };

  const reset = () => {
    setPrefs(DEFAULT_A11Y_PREFS);
    writeA11yPreferences(DEFAULT_A11Y_PREFS);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[95]" dir="rtl">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="תפריט נגישות"
          className="mb-3 w-[min(100vw-2rem,20rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.75)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[var(--color-ink)]">
              תפריט נגישות
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור תפריט נגישות"
              className="p-1 rounded-lg text-[var(--color-subtle)] hover:bg-white/[0.06]"
            >
              <IconX size={18} />
            </button>
          </div>

          <div className="space-y-3">
            <ToggleRow
              icon={<IconTextSize size={18} />}
              label="הגדלת טקסט"
              active={prefs.fontSize !== "normal"}
              onClick={() =>
                update({
                  fontSize: nextFontSize(prefs.fontSize),
                })
              }
              detail={fontLabel(prefs.fontSize)}
            />
            <ToggleRow
              icon={<IconContrast size={18} />}
              label="ניגודיות גבוהה"
              active={prefs.highContrast}
              onClick={() => update({ highContrast: !prefs.highContrast })}
            />
            <ToggleRow
              icon={<IconLink size={18} />}
              label="הדגשת קישורים"
              active={prefs.underlineLinks}
              onClick={() => update({ underlineLinks: !prefs.underlineLinks })}
            />
            <ToggleRow
              icon={<IconPlayerPause size={18} />}
              label="הפחתת אנימציות"
              active={prefs.reduceMotion}
              onClick={() => update({ reduceMotion: !prefs.reduceMotion })}
            />
            <ToggleRow
              icon={<IconLetterSpacing size={18} />}
              label="גופן קריא יותר"
              active={prefs.readableFont}
              onClick={() => update({ readableFont: !prefs.readableFont })}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-xl border border-[var(--color-border)] py-2 text-sm text-[var(--color-body)] hover:bg-white/[0.04]"
            >
              איפוס הגדרות
            </button>
            <Link
              href="/accessibility"
              className="text-center text-xs text-[var(--color-accent)] hover:underline"
              onClick={() => setOpen(false)}
            >
              להצהרת הנגישות המלאה
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-lg hover:opacity-90 transition-opacity"
        aria-label={open ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
      >
        <IconAccessible size={26} stroke={1.75} />
      </button>
    </div>
  );
}

function ToggleRow(props: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  detail?: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={props.active}
      className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-colors ${
        props.active
          ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
          : "border-[var(--color-border)] hover:bg-white/[0.03]"
      }`}
    >
      <span className="text-[var(--color-accent)]">{props.icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-[var(--color-ink)]">
          {props.label}
        </span>
        {props.detail ? (
          <span className="block text-xs text-[var(--color-subtle)]">
            {props.detail}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function nextFontSize(current: A11yFontSize): A11yFontSize {
  if (current === "normal") return "large";
  if (current === "large") return "xlarge";
  return "normal";
}

function fontLabel(size: A11yFontSize): string {
  if (size === "large") return "מוגדל";
  if (size === "xlarge") return "מוגדל מאוד";
  return "רגיל";
}
