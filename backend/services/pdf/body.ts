import { escapeHtml } from "./escape";
import { todayFormatted } from "@/lib/utils";
import { stripAiDashes } from "../ai/strip-ai-dashes";

export function buildBodyHtml(content: string): string {
  const paragraphs = stripAiDashes(content)
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  return `<div class="letter-title">
    <h1>מכתב התראה</h1>
  </div>
  <div class="letter-subject">${escapeHtml(todayFormatted())}</div>

  <div class="letter-body">
    ${paragraphs}
  </div>`;
}
