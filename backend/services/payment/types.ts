export const PAID_PAYMENT_STATUS = "completed";

export function isPaidPaymentStatus(status: string | null | undefined): boolean {
  return status === PAID_PAYMENT_STATUS;
}

export interface CreateCheckoutInput {
  leadId: string;
  amountIls: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  externalRequestId: string;
}

export type ParsedWebhookStatus = "completed" | "failed";

export interface ParsedWebhook {
  status: ParsedWebhookStatus;
  leadId: string;
  amountIls: number;
  externalRequestId?: string;
  externalTransactionId?: string;
  failureReason?: string;
}

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyAndParseWebhook(req: Request): Promise<ParsedWebhook>;
}
