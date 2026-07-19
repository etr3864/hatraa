import type { AiProvider } from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";

export interface ModelPriceSnapshot {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

export async function getActiveModelPrice(
  provider: AiProvider,
  model: string,
  at = new Date()
): Promise<ModelPriceSnapshot> {
  const price = await prisma.aiModelPrice.findFirst({
    where: {
      provider,
      model,
      effectiveFrom: { lte: at },
    },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!price) {
    throw new Error(`Missing AI price for ${provider}/${model}`);
  }

  return {
    inputUsdPerMillion: Number(price.inputUsdPerMillion),
    outputUsdPerMillion: Number(price.outputUsdPerMillion),
  };
}

