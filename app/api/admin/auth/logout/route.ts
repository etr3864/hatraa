import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/backend/services/security/admin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

