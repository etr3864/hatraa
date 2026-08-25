import { PayPlusProvider } from "./providers/payplus/client";
import type { PaymentProvider } from "./types";

export function resolvePaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER?.trim() || "payplus").toLowerCase();
  if (provider !== "payplus") {
    throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
  }
  return new PayPlusProvider();
}
