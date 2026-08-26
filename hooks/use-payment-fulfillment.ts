"use client";

import { useEffect, useRef } from "react";
import type { PaymentStreamEventType } from "@/backend/services/payment/stream-events";

export interface PaymentFulfillmentSnapshot {
  phase: PaymentStreamEventType;
  content?: string;
  rewriteStage?: string | null;
  rewriteError?: string | null;
}

interface UsePaymentFulfillmentOptions {
  leadId: string | null;
  enabled: boolean;
  streamKey?: number;
  onUpdate: (snapshot: PaymentFulfillmentSnapshot) => void;
  onTerminal: (snapshot: PaymentFulfillmentSnapshot) => void;
}

const TERMINAL: ReadonlySet<PaymentStreamEventType> = new Set([
  "rewrite_ready",
  "rewrite_failed",
  "payment_failed",
  "timeout",
  "error",
]);

export function usePaymentFulfillment({
  leadId,
  enabled,
  streamKey = 0,
  onUpdate,
  onTerminal,
}: UsePaymentFulfillmentOptions): void {
  const onUpdateRef = useRef(onUpdate);
  const onTerminalRef = useRef(onTerminal);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onTerminalRef.current = onTerminal;
  }, [onTerminal]);

  useEffect(() => {
    if (!enabled || !leadId) return;

    const source = new EventSource(
      `/api/payment/stream?leadId=${encodeURIComponent(leadId)}`
    );

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as PaymentFulfillmentSnapshot;
        onUpdateRef.current(event);
        if (TERMINAL.has(event.phase)) {
          onTerminalRef.current(event);
          source.close();
        }
      } catch {
        onTerminalRef.current({
          phase: "error",
          rewriteError: "שגיאה בקבלת עדכון מהשרת",
        });
        source.close();
      }
    };

    source.onerror = () => {
      onTerminalRef.current({
        phase: "error",
        rewriteError: "החיבור לשרת נותק. נסה שוב.",
      });
      source.close();
    };

    return () => source.close();
  }, [enabled, leadId, streamKey]);
}
