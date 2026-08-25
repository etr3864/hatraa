function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getPayPlusConfig() {
  return {
    apiKey: requiredEnv("PAYPLUS_API_KEY"),
    secretKey: requiredEnv("PAYPLUS_SECRET_KEY"),
    paymentPageUid: requiredEnv("PAYPLUS_PAYMENT_PAGE_UID"),
    baseUrl: (
      process.env.PAYPLUS_BASE_URL?.trim() ||
      "https://restapi.payplus.co.il/api/v1.0"
    ).replace(/\/+$/, ""),
  };
}
