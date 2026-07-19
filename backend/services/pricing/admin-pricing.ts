import type { AiProvider } from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";
import { getUsdIlsRate } from "./exchange-rate";

export async function getPricingSettings() {
  const [prices, currentFxRate, latestFxRows] = await Promise.all([
    prisma.aiModelPrice.findMany({
      orderBy: [
        { provider: "asc" },
        { model: "asc" },
        { effectiveFrom: "desc" },
      ],
    }),
    getUsdIlsRate(),
    prisma.fxRate.findMany({
      orderBy: [{ rateDate: "desc" }, { isManualOverride: "desc" }],
      take: 30,
    }),
  ]);

  return {
    currentFxRate,
    prices: prices.map((price) => ({
      id: price.id,
      provider: price.provider,
      model: price.model,
      inputUsdPerMillion: Number(price.inputUsdPerMillion),
      outputUsdPerMillion: Number(price.outputUsdPerMillion),
      effectiveFrom: price.effectiveFrom.toISOString(),
      createdAt: price.createdAt.toISOString(),
    })),
    fxRates: latestFxRows.map((rate) => ({
      id: rate.id,
      rateDate: rate.rateDate.toISOString().slice(0, 10),
      usdIlsRate: Number(rate.usdIlsRate),
      source: rate.source,
      isManualOverride: rate.isManualOverride,
    })),
  };
}

export async function createModelPrice(input: {
  provider: AiProvider;
  model: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  effectiveFrom: Date;
}) {
  return prisma.aiModelPrice.create({ data: input });
}

export async function setManualFxRate(input: {
  rateDate: Date;
  usdIlsRate: number;
}) {
  return prisma.fxRate.upsert({
    where: {
      rateDate_source: {
        rateDate: input.rateDate,
        source: "manual",
      },
    },
    create: {
      ...input,
      source: "manual",
      isManualOverride: true,
    },
    update: {
      usdIlsRate: input.usdIlsRate,
      isManualOverride: true,
    },
  });
}

