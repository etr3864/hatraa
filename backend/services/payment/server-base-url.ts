/** Server-side callbacks (job wake, etc.). Prefer SITE_URL2, fall back to SITE_URL. */
export function getServerPublicBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL2?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SITE_URL2 or NEXT_PUBLIC_SITE_URL is not set");
  }
  return url.replace(/\/+$/, "");
}
