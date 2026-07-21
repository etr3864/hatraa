import { escapeHtml } from "./escape";
import { stripAiDashes } from "../ai/strip-ai-dashes";
import { sanitizeLetterContent } from "../ai/sanitize-letter-content";

export function buildBodyHtml(
  content: string,
  options?: {
    senderName: string;
    senderPhone?: string;
    senderEmail?: string;
    attorneyVerified?: boolean;
  }
): string {
  const cleaned = options
    ? sanitizeLetterContent(content, { ...options, forPdf: true })
    : content;

  const paragraphs = stripAiDashes(cleaned)
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map((p) => {
      const html = escapeHtml(p).replace(/\n/g, "<br/>");
      return `<p>${html}</p>`;
    })
    .join("\n");

  return `<div class="letter-subject">
  <p>הנדון: מכתב התראה</p>
</div>
<div class="letter-body">
  ${paragraphs}
</div>`;
}
