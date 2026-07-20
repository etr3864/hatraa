import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  validateAdminPassword,
} from "@/backend/services/security/admin-auth";
import {
  assertAdminLoginAllowed,
  clearAdminLoginFailures,
  recordAdminLoginFailure,
} from "@/backend/services/security/admin-login-guard";
import { getClientIp } from "@/backend/services/security/rate-limiter";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const guard = await assertAdminLoginAllowed(ip);
  if (!guard.allowed) {
    return NextResponse.json(
      {
        error: `יותר מדי ניסיונות כושלים. נסה שוב בעוד ${Math.ceil(guard.retryAfterSec / 60)} דקות.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(guard.retryAfterSec) },
      }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;

  if (!body?.password || !validateAdminPassword(body.password)) {
    await recordAdminLoginFailure(ip);
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  await clearAdminLoginFailures(ip);

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
