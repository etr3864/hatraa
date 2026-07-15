import Anthropic from "@anthropic-ai/sdk";
import type { LetterInput } from "@/lib/types";
import {
  normalizeEvidenceMime,
  isSupportedEvidenceMime,
  cleanBase64,
} from "@/lib/evidence-mime";
import { SYSTEM_PROMPT } from "./prompts/system";
import { parseModelJson } from "./parse-response";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function callModel(
  input: LetterInput,
  userPrompt: string
): Promise<{ raw: string; parsed: ReturnType<typeof parseModelJson> }> {
  const anthropic = getClient();
  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  if (input.evidence && input.evidence.length > 0) {
    for (const file of input.evidence) {
      const mime = normalizeEvidenceMime(file.type, file.name);
      if (!isSupportedEvidenceMime(mime)) continue;
      const data = cleanBase64(file.base64);
      if (!data) continue;

      if (mime === "application/pdf") {
        contentBlocks.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data },
        });
        continue;
      }

      if (mime === "image/heic" || mime === "image/heif") {
        continue;
      }

      const mediaType = mime as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      contentBlocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data },
      });
    }
  }

  contentBlocks.push({ type: "text", text: userPrompt });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    return { raw, parsed: parseModelJson(raw) };
  } catch (err) {
    throw new Error(mapAnthropicClientError(err));
  }
}

function mapAnthropicClientError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/quota has been exceeded|spending limit|credit|billing|insufficient/i.test(message)) {
    return "נגמרה מכסת השימוש בשירות ייצור המכתבים. נסה שוב מאוחר יותר, או בדוק את חשבון Anthropic.";
  }
  if (/rate.?limit|too many requests|429/i.test(message)) {
    return "יותר מדי בקשות ברגע זה. המתן כדקה ונסה שוב.";
  }
  if (/request.?too.?large|413|image|media.?type|expected pattern/i.test(message)) {
    return "הראיות כבדות מדי או בפורמט לא נתמך. נסה פחות קבצים או תמונות קטנות יותר.";
  }
  return "שגיאה בייצור המכתב. אנא נסה שוב.";
}
