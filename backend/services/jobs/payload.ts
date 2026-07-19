import { decrypt, encrypt } from "@/backend/services/security/encryption";

export function encryptJobPayload<T>(payload: T): string {
  return encrypt(JSON.stringify(payload));
}

export function decryptJobPayload<T>(payload: string): T {
  const decrypted = decrypt(payload);
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    throw new Error("Job payload is invalid or cannot be decrypted");
  }
}

