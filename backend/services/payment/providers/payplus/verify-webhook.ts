import { createHmac, timingSafeEqual } from "crypto";
import { getPayPlusConfig } from "./config";

export function verifyPayPlusWebhook(rawBody: string, req: Request): boolean {
  const userAgent = req.headers.get("user-agent") ?? "";
  if (userAgent !== "PayPlus") return false;

  const hash = req.headers.get("hash");
  if (!hash || !rawBody) return false;

  const { secretKey } = getPayPlusConfig();
  const candidates = [rawBody];
  try {
    candidates.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    // raw body is not JSON; compare only the original payload
  }

  return candidates.some((candidate) => hashesMatch(candidate, hash, secretKey));
}

function hashesMatch(message: string, hash: string, secretKey: string): boolean {
  const expected = createHmac("sha256", secretKey).update(message).digest("base64");
  const actualBuf = Buffer.from(hash);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(actualBuf, expectedBuf);
}
