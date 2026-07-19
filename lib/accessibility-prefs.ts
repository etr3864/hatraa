export const A11Y_STORAGE_KEY = "hatraah:a11y-prefs";

export type A11yFontSize = "normal" | "large" | "xlarge";

export interface A11yPreferences {
  fontSize: A11yFontSize;
  highContrast: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
  readableFont: boolean;
}

export const DEFAULT_A11Y_PREFS: A11yPreferences = {
  fontSize: "normal",
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false,
  readableFont: false,
};

export function readA11yPreferences(): A11yPreferences {
  if (typeof window === "undefined") return DEFAULT_A11Y_PREFS;
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULT_A11Y_PREFS;
    return { ...DEFAULT_A11Y_PREFS, ...(JSON.parse(raw) as A11yPreferences) };
  } catch {
    return DEFAULT_A11Y_PREFS;
  }
}

export function writeA11yPreferences(prefs: A11yPreferences): void {
  localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  applyA11yPreferences(prefs);
}

export function applyA11yPreferences(prefs: A11yPreferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.a11yFont = prefs.fontSize;
  root.dataset.a11yContrast = prefs.highContrast ? "high" : "default";
  root.dataset.a11yLinks = prefs.underlineLinks ? "underline" : "default";
  root.dataset.a11yMotion = prefs.reduceMotion ? "reduce" : "default";
  root.dataset.a11yFontFamily = prefs.readableFont ? "readable" : "default";
}
