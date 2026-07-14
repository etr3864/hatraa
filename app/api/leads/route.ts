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
    // Admin-only — מאפשר ייצוא מלא (עד 5k) בלי pagination מיותר
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 5000);
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
        include: {
          letter: true,
          payment: true,
          evidence: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    const { getEvidenceSignedUrl, isR2Configured } = await import(
      "@/backend/services/storage/r2"
    );
    const r2Ok = isR2Configured();

    const decrypted = await Promise.all(
      leads.map(async (lead) => {
        const base = decryptLeadPii(lead);
        const evidence = await Promise.all(
          (lead.evidence ?? []).map(async (item) => {
            let url: string | undefined;
            if (r2Ok) {
              try {
                url = await getEvidenceSignedUrl(item.r2Key, 3600);
              } catch (err) {
                console.error(
                  "[leads] signed url:",
                  err instanceof Error ? err.message : err
                );
              }
            }
            return {
              id: item.id,
              leadId: item.leadId,
              label: item.label,
              fileName: item.fileName,
              mimeType: item.mimeType,
              sizeBytes: item.sizeBytes,
              description: item.description,
              sortOrder: item.sortOrder,
              createdAt: item.createdAt,
              url,
            };
          })
        );
        return { ...base, evidence };
      })
    );

    return NextResponse.json({ leads: decrypted, total, page, limit });
  } catch (err) {
    console.error("[leads]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "שגיאה בטעינת הלידים" }, { status: 500 });
  }
}
