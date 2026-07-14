import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { validateAdminToken } from "@/backend/services/security/admin-auth";
import { decryptLeadPii } from "@/backend/services/security/encryption";
import type { Category } from "@/lib/types";
import { VALID_CATEGORIES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    if (!validateAdminToken(req)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category");
    const category =
      categoryParam && VALID_CATEGORIES.includes(categoryParam as Category)
        ? (categoryParam as Category)
        : null;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(category && {
        letter: { category },
      }),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { letter: true, payment: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    const decrypted = leads.map((lead) => decryptLeadPii(lead));

    return NextResponse.json({ leads: decrypted, total, page, limit });
  } catch (err) {
    console.error("[leads]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "שגיאה בטעינת הלידים" }, { status: 500 });
  }
}
