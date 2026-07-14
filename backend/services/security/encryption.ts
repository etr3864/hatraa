import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.trim().length < 16) {
    throw new Error("ENCRYPTION_KEY is not set or too short");
  }
  return createHash("sha256").update(raw).digest();
}

export function encrypt(text: string): string {
  if (!text) return text;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${PREFIX}${payload}`;
}

/**
 * מפענח ערך. אם הערך אינו בפורמט מוצפן (לידים ישנים) — מחזיר as-is.
 */
export function decrypt(value: string): string {
  if (!value) return value;
  if (!value.startsWith(PREFIX)) return value;

  try {
    const key = getKey();
    const payload = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = payload.subarray(0, IV_LENGTH);
    const tag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const data = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return value;
  }
}

export function encryptOptional(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  return encrypt(value);
}

export function decryptOptional(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  return decrypt(value);
}

export interface LeadPiiFields {
  name: string;
  idNumber?: string | null;
  address: string;
  phone: string;
  email: string;
}

export function encryptLeadPii(fields: LeadPiiFields): LeadPiiFields {
  return {
    name: encrypt(fields.name),
    idNumber: encryptOptional(fields.idNumber),
    address: encrypt(fields.address),
    phone: encrypt(fields.phone),
    email: encrypt(fields.email),
  };
}

export function decryptLeadPii<T extends LeadPiiFields>(lead: T): T {
  return {
    ...lead,
    name: decrypt(lead.name),
    idNumber: decryptOptional(lead.idNumber),
    address: decrypt(lead.address),
    phone: decrypt(lead.phone),
    email: decrypt(lead.email),
  };
}
