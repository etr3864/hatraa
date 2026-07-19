export function calculateAiCost(input: {
  inputTokens: number;
  outputTokens: number;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  usdIlsRate: number;
}) {
  const costUsd =
    (input.inputTokens * input.inputUsdPerMillion +
      input.outputTokens * input.outputUsdPerMillion) /
    1_000_000;

  return {
    costUsd,
    costIls: costUsd * input.usdIlsRate,
  };
}

