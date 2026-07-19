export const COOKIE_CONSENT_KEY = "hatraah:cookie-consent";

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  decidedAt: string;
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed.analytics !== "boolean" || !parsed.decidedAt) {
      return null;
    }
    return {
      necessary: true,
      analytics: parsed.analytics,
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(
  analytics: boolean
): CookieConsent {
  const consent: CookieConsent = {
    necessary: true,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event("hatraah:cookie-consent-changed"));
  return consent;
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.analytics === true;
}
