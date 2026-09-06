import { ThinkingLevel, type GenerateContentConfig } from "@google/genai";

export const GEMINI_FLASH_MODEL = "gemini-3.8-flash";

export function geminiFlashConfig(opts?: {
  systemInstruction?: string;
  thinkingLevel?: ThinkingLevel;
}): GenerateContentConfig {
  return {
    ...(opts?.systemInstruction
      ? { systemInstruction: opts.systemInstruction }
      : {}),
    thinkingConfig: {
      thinkingLevel: opts?.thinkingLevel ?? ThinkingLevel.LOW,
    },
  };
}
