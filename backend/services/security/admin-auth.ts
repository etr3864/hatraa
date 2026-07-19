import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "hatraa_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.trim().length < 8) return null;
  return secret;
}

export function validateAdminToken(request: NextRequest): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (session && validateAdminSessionCookie(session)) return true;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
  return token ? safeEqual(token, secret) : false;
}

export function validateAdminPassword(password: string): boolean {
  const secret = getAdminSecret();
  return !!secret && safeEqual(password, secret);
}

export function createAdminSessionToken(): string {
  const secret = getAdminSecret();
  if (!secret) throw new Error("ADMIN_SECRET is not configured");

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = sign(String(expiresAt), secret);
  return `${expiresAt}.${signature}`;
}

export function validateAdminSessionCookie(token: string): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!signature || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }
  return safeEqual(signature, sign(expiresAtRaw, secret));
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
