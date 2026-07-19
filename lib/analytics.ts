export type ClientAnalyticsEvent =
  | "SITE_VISIT"
  | "WIZARD_STARTED"
  | "DETAILS_COMPLETED"
  | "PAYMENT_STARTED";

interface AnalyticsDimensions {
  entityId?: string;
  inputMode?: "text" | "audio";
  hasEvidence?: boolean;
  senderType?: "individual" | "company";
  category?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

export function trackClientEvent(
  type: ClientAnalyticsEvent,
  dimensions: AnalyticsDimensions = {}
): void {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...dimensions }),
    keepalive: true,
  }).catch(() => undefined);
}

