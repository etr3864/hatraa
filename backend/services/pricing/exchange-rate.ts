import { prisma } from "@/backend/services/db/prisma";

const FX_SOURCE = "frankfurter";
const FALLBACK_RATE = 3.6;

export async function getUsdIlsRate(at = new Date()): Promise<number> {
  const rateDate = startOfUtcDay(at);
  const stored = await prisma.fxRate.findFirst({
    where: { rateDate: { lte: rateDate } },
    orderBy: [
      { rateDate: "desc" },
      { isManualOverride: "desc" },
      { createdAt: "desc" },
    ],
  });

  if (stored && isSameUtcDay(stored.rateDate, rateDate)) {
    return Number(stored.usdIlsRate);
  }

  const liveRate = await fetchCurrentRate();
  if (liveRate) {
    await prisma.fxRate.upsert({
      where: {
        rateDate_source: {
          rateDate,
          source: FX_SOURCE,
        },
      },
      create: {
        rateDate,
        usdIlsRate: liveRate,
        source: FX_SOURCE,
      },
      update: { usdIlsRate: liveRate },
    });
    return liveRate;
  }

  if (stored) return Number(stored.usdIlsRate);

  const configured = Number(process.env.USD_ILS_FALLBACK_RATE);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : FALLBACK_RATE;
}

async function fetchCurrentRate(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=ILS",
      { signal: AbortSignal.timeout(2500), cache: "no-store" }
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      rates?: { ILS?: number };
    };
    const rate = payload.rates?.ILS;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

function isSameUtcDay(left: Date | undefined, right: Date): boolean {
  return !!left && left.getTime() === right.getTime();
}

