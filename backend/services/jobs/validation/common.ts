import { sanitizeInput } from "@/backend/services/security/sanitize";
import type { StoredFileReference } from "@/lib/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error("מזהה המשימה אינו תקין");
  }
  return value;
}

export function sanitizeStoredFiles(
  sessionId: string,
  value: unknown,
  maximum = 8
): StoredFileReference[] {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new Error("רשימת הקבצים אינה תקינה");
  }

  return value.map((item) => sanitizeStoredFile(sessionId, item));
}

export function sanitizeStoredFile(
  sessionId: string,
  value: unknown
): StoredFileReference {
  const item = value as Partial<StoredFileReference> | null;
  const sizeBytes = item?.sizeBytes;
  if (
    !item ||
    typeof item.key !== "string" ||
    !item.key.startsWith(`jobs/${sessionId}/`) ||
    typeof item.name !== "string" ||
    typeof item.type !== "string" ||
    typeof sizeBytes !== "number" ||
    !Number.isInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > 10 * 1024 * 1024
  ) {
    throw new Error("הפניה לקובץ אינה תקינה");
  }

  return {
    key: item.key,
    name: sanitizeInput(item.name).slice(0, 120),
    type: item.type.slice(0, 80),
    sizeBytes,
    description:
      typeof item.description === "string"
        ? sanitizeInput(item.description).slice(0, 500)
        : undefined,
  };
}

