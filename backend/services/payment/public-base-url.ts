export function getPaymentPublicBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL2?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SITE_URL2 is not set");
  }
  return url.replace(/\/+$/, "");
}
