export const ANALYTICS_SESSION_COOKIE = "hatraa_session";

export const CLIENT_ANALYTICS_EVENTS = [
  "SITE_VISIT",
  "WIZARD_STARTED",
  "DETAILS_COMPLETED",
  "PAYMENT_STARTED",
  "PAYMENT_FAILED",
] as const;

export type ClientAnalyticsEvent = (typeof CLIENT_ANALYTICS_EVENTS)[number];

export type AnalyticsEventName =
  | ClientAnalyticsEvent
  | "EXTRACTION_COMPLETED"
  | "LETTER_GENERATED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "ATTORNEY_REWRITE_COMPLETED"
  | "PDF_DOWNLOADED";

