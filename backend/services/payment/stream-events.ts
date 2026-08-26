import type { PaymentFulfillmentStatus } from "./fulfillment";

export type PaymentStreamEventType =
  | "awaiting_payment"
  | "payment_failed"
  | "paid_pending_rewrite"
  | "rewrite_queued"
  | "rewrite_processing"
  | "rewrite_ready"
  | "rewrite_failed"
  | "timeout"
  | "error";

export interface PaymentStreamEvent {
  type: PaymentStreamEventType;
  phase: PaymentFulfillmentStatus["phase"];
  rewriteStage?: string | null;
  rewriteError?: string | null;
  content?: string;
}

export const PAYMENT_STREAM_INTERVAL_MS = 1_500;
export const PAYMENT_STREAM_TIMEOUT_MS = 5 * 60 * 1_000;

export function fulfillmentToStreamEvent(
  status: PaymentFulfillmentStatus
): PaymentStreamEvent {
  return {
    type: status.phase,
    phase: status.phase,
    rewriteStage: status.rewriteStage,
    rewriteError: status.rewriteError,
    content: status.content,
  };
}

export function streamEventKey(event: PaymentStreamEvent): string {
  return [
    event.type,
    event.rewriteStage ?? "",
    event.rewriteError ?? "",
    event.content ? "content" : "",
  ].join("|");
}

export function isTerminalStreamEvent(type: PaymentStreamEventType): boolean {
  return (
    type === "rewrite_ready" ||
    type === "rewrite_failed" ||
    type === "payment_failed" ||
    type === "timeout" ||
    type === "error"
  );
}
