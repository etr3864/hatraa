/**
 * Neon / Prisma historically run with sslmode=require while pg treated it
 * like verify-full. Pin that explicitly so pg v9 won't silently weaken TLS.
 * Local databases without sslmode are left untouched.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
