function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function isSuccessfulStatus(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return (
    normalized === "success" ||
    normalized === "approved" ||
    normalized === "completed" ||
    normalized === "0"
  );
}

export function extractPayPlusWebhookPayload(body: unknown): {
  leadId?: string;
  amountIls?: number;
  successful: boolean;
  externalRequestId?: string;
  externalTransactionId?: string;
  failureReason?: string;
} {
  const root = asRecord(body) ?? {};
  const data = asRecord(root.data) ?? root;
  const transaction = asRecord(data.transaction) ?? asRecord(root.transaction) ?? {};
  const results = asRecord(root.results) ?? asRecord(data.results) ?? {};

  const leadId = readString(
    data.more_info,
    root.more_info,
    transaction.more_info
  );
  const amountIls = readNumber(
    transaction.amount,
    data.amount,
    root.amount
  );
  const status = readString(
    transaction.status,
    transaction.status_code,
    results.status,
    data.status,
    root.status
  );
  const successful = isSuccessfulStatus(status);

  return {
    leadId,
    amountIls,
    successful,
    externalRequestId: readString(
      data.page_request_uid,
      data.payment_request_uid,
      root.page_request_uid,
      root.payment_request_uid
    ),
    externalTransactionId: readString(
      transaction.uid,
      transaction.transaction_uid,
      data.transaction_uid,
      root.transaction_uid
    ),
    failureReason: successful
      ? undefined
      : readString(
          results.description,
          transaction.status_description,
          data.status_description,
          root.description
        ),
  };
}
