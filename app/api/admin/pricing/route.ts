import { AiProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createModelPrice,
  getPricingSettings,
  setManualFxRate,
} from "@/backend/services/pricing/admin-pricing";
import { validateAdminToken } from "@/backend/services/security/admin-auth";

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getPricingSettings());
  } catch {
    return NextResponse.json(
      { error: "שגיאה בטעינת הגדרות העלויות" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "בקשה לא מורשית" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        type: "model-price";
        provider: string;
        model: string;
        inputUsdPerMillion: number;
        outputUsdPerMillion: number;
        effectiveFrom: string;
      }
    | {
        type: "fx-override";
        usdIlsRate: number;
        rateDate: string;
      }
    | null;

  try {
    if (body?.type === "model-price") {
      if (
        !Object.values(AiProvider).includes(body.provider as AiProvider) ||
        !validModel(body.model) ||
        !validPrice(body.inputUsdPerMillion) ||
        !validPrice(body.outputUsdPerMillion)
      ) {
        return NextResponse.json({ error: "מחיר מודל לא תקין" }, { status: 400 });
      }
      const effectiveFrom = new Date(body.effectiveFrom);
      if (Number.isNaN(effectiveFrom.getTime())) {
        return NextResponse.json({ error: "תאריך תחולה לא תקין" }, { status: 400 });
      }

      await createModelPrice({
        provider: body.provider as AiProvider,
        model: body.model.trim(),
        inputUsdPerMillion: body.inputUsdPerMillion,
        outputUsdPerMillion: body.outputUsdPerMillion,
        effectiveFrom,
      });
    } else if (body?.type === "fx-override") {
      const rateDate = new Date(`${body.rateDate}T00:00:00.000Z`);
      if (!validFxRate(body.usdIlsRate) || Number.isNaN(rateDate.getTime())) {
        return NextResponse.json({ error: "שער דולר לא תקין" }, { status: 400 });
      }
      await setManualFxRate({ rateDate, usdIlsRate: body.usdIlsRate });
    } else {
      return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
    }

    return NextResponse.json(await getPricingSettings());
  } catch (error) {
    const duplicate =
      error instanceof Error && error.message.includes("Unique constraint");
    return NextResponse.json(
      {
        error: duplicate
          ? "כבר קיים מחיר למודל בתאריך התחולה הזה"
          : "שמירת ההגדרות נכשלה",
      },
      { status: duplicate ? 409 : 500 }
    );
  }
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !!origin && origin === request.nextUrl.origin;
}

function validModel(value: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{1,79}$/i.test(value.trim());
}

function validPrice(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 10_000;
}

function validFxRate(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 10;
}

