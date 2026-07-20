import { NextRequest, NextResponse } from "next/server";
import {
  deleteLeadsByIds,
  MAX_BULK_DELETE,
} from "@/backend/services/leads/delete-leads";
import { validateAdminToken } from "@/backend/services/security/admin-auth";

export async function POST(req: NextRequest) {
  try {
    if (!validateAdminToken(req)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      ids?: unknown;
    } | null;

    if (!Array.isArray(body?.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "לא נבחרו לידים למחיקה" }, { status: 400 });
    }

    const ids = body.ids.filter((id): id is string => typeof id === "string");
    if (ids.length === 0) {
      return NextResponse.json({ error: "לא נבחרו לידים למחיקה" }, { status: 400 });
    }
    if (ids.length > MAX_BULK_DELETE) {
      return NextResponse.json(
        { error: `ניתן למחוק עד ${MAX_BULK_DELETE} לידים בפעם אחת` },
        { status: 400 }
      );
    }

    const result = await deleteLeadsByIds(ids);
    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      requested: result.requested,
    });
  } catch (err) {
    console.error("[leads:bulk-delete]", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "שגיאה במחיקת הלידים";
    const isUserError = /[\u0590-\u05FF]/.test(message);
    return NextResponse.json(
      { error: isUserError ? message : "שגיאה במחיקת הלידים" },
      { status: isUserError ? 400 : 500 }
    );
  }
}
