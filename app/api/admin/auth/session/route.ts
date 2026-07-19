import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/backend/services/security/admin-auth";

export async function GET(request: NextRequest) {
  const authenticated = validateAdminToken(request);
  return NextResponse.json(
    { authenticated },
    { status: authenticated ? 200 : 401 }
  );
}

