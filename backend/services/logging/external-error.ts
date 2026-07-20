/** Safe one-line message for logs (never includes secrets from env). */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function logExternalError(
  scope: string,
  err: unknown,
  meta?: Record<string, unknown>
): void {
  const payload: Record<string, unknown> = {
    ...meta,
    message: errorMessage(err),
  };
  if (err instanceof Error && err.stack) {
    payload.stack = err.stack;
  }
  if (err instanceof Error && err.cause) {
    payload.cause = errorMessage(err.cause);
  }
  console.error(`[${scope}]`, payload);
}
