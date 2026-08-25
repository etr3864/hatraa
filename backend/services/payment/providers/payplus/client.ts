import { getPaymentPublicBaseUrl } from "../../public-base-url";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from "../../types";
import { getPayPlusConfig } from "./config";
import { extractPayPlusWebhookPayload } from "./map-status";
import { verifyPayPlusWebhook } from "./verify-webhook";

interface GenerateLinkResponse {
  results?: { status?: string; description?: string };
  data?: {
    page_request_uid?: string;
    payment_page_link?: string;
  };
}

export class PayPlusProvider implements PaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const config = getPayPlusConfig();
    const baseUrl = getPaymentPublicBaseUrl();
    const customer = Object.fromEntries(
      Object.entries({
        customer_name: input.customer?.name,
        email: input.customer?.email,
        phone: input.customer?.phone,
      }).filter(([, value]) => Boolean(value))
    );

    const response = await fetch(`${config.baseUrl}/PaymentPages/generateLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
        "secret-key": config.secretKey,
      },
      body: JSON.stringify({
        payment_page_uid: config.paymentPageUid,
        amount: input.amountIls,
        currency_code: "ILS",
        charge_method: 1, // J4 — חיוב מיידי
        more_info: input.leadId,
        sendEmailApproval: false,
        sendEmailFailure: false,
        send_failure_callback: true,
        refURL_success: `${baseUrl}/result?payment=success`,
        refURL_failure: `${baseUrl}/result?payment=failure`,
        refURL_callback: `${baseUrl}/api/payment/webhook`,
        ...(Object.keys(customer).length > 0 ? { customer } : {}),
      }),
    });

    const payload = (await response.json()) as GenerateLinkResponse;
    const checkoutUrl = payload.data?.payment_page_link;
    const externalRequestId = payload.data?.page_request_uid;
    if (!response.ok || !checkoutUrl || !externalRequestId) {
      throw new Error(
        payload.results?.description || "לא הצלחנו לפתוח דף תשלום. נסה שוב."
      );
    }

    return { checkoutUrl, externalRequestId };
  }

  async verifyAndParseWebhook(req: Request): Promise<ParsedWebhook> {
    const rawBody =
      req.method === "GET"
        ? JSON.stringify(Object.fromEntries(new URL(req.url).searchParams))
        : await req.text();
    if (!verifyPayPlusWebhook(rawBody, req)) {
      throw new WebhookAuthError();
    }

    let parsed: unknown;
    if (req.method === "GET") {
      parsed = Object.fromEntries(new URL(req.url).searchParams);
    } else {
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        throw new Error("גוף הבקשה אינו תקין");
      }
    }

    const payload = extractPayPlusWebhookPayload(parsed);
    if (!payload.leadId) {
      throw new Error("חסר מזהה ליד ב-callback");
    }

    return {
      status: payload.successful ? "completed" : "failed",
      leadId: payload.leadId,
      amountIls: payload.amountIls ?? 0,
      externalRequestId: payload.externalRequestId,
      externalTransactionId: payload.externalTransactionId,
      failureReason: payload.failureReason,
    };
  }
}

export class WebhookAuthError extends Error {
  constructor() {
    super("PayPlus webhook authentication failed");
    this.name = "WebhookAuthError";
  }
}
