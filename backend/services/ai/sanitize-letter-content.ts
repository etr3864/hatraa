import { ATTORNEY } from "@/lib/attorney";

interface SanitizeLetterOptions {
  senderName: string;
  senderPhone?: string;
  senderEmail?: string;
  attorneyVerified?: boolean;
}

const PLACEHOLDER_IN_BRACKETS = /\[[^\]]{2,}\]/g;

/** Attorney/signature placeholders the model sometimes emits despite prompts. */
const ATTORNEY_PLACEHOLDER_PATTERNS = [
  /עו["״]ד\s*\[שם להשלמה\]/gi,
  /עו["״]ד\s*\[שם\s*עו["״]ד\s*להשלמה\]/gi,
  /\[שם להשלמה\]/g,
  /\[שם עו["״]ד\]/gi,
  /\[שם מלא\]/g,
] as const;

export function sanitizeLetterContent(
  content: string,
  options: SanitizeLetterOptions
): string {
  const signatureName = options.attorneyVerified
    ? ATTORNEY.displayName.includes("להשלמה")
      ? options.senderName
      : ATTORNEY.displayName
    : options.senderName;

  let result = content;
  for (const pattern of ATTORNEY_PLACEHOLDER_PATTERNS) {
    result = result.replace(pattern, signatureName);
  }

  result = result.replace(PLACEHOLDER_IN_BRACKETS, (match) => {
    if (match === "[שם_נתבע]" || match === "[חודש]" || match === "[שנה]") {
      return match;
    }
    return "";
  });

  if (options.senderPhone && options.senderEmail) {
    const contactLine = `${options.senderPhone} | ${options.senderEmail}`;
    result = result.replace(
      /\|\s*\[טלפון\]\s*\|\s*\[מייל\]/g,
      `| ${contactLine}`
    );
    result = result.replace(/\[טלפון\]/g, options.senderPhone);
    result = result.replace(/\[מייל\]/g, options.senderEmail);
  }

  if (options.attorneyVerified && !ATTORNEY.displayName.includes("להשלמה")) {
    result = fixAttorneySignature(result, options.senderName, signatureName);
  }

  return result.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * When the AI incorrectly signs as the client instead of the attorney,
 * replace the client name in the signature block with the attorney name.
 */
function fixAttorneySignature(
  content: string,
  clientName: string,
  attorneyName: string
): string {
  if (!clientName.trim()) return content;
  const escaped = clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Fix closing signature: "בכבוד רב,\n<clientName>" → "בכבוד רב,\n<attorney>"
  const closingPattern = new RegExp(
    `(בכבוד רב[,،]?\\s*(?:ובציפייה לתגובתכם[,،]?\\s*)?)\\n${escaped}\\s*$`,
    "m"
  );
  let result = content.replace(closingPattern, `$1\n${attorneyName}`);

  // Fix opening sender line: first line is just the client name
  const lines = result.split("\n");
  if (lines[0]?.trim() === clientName.trim()) {
    lines[0] = attorneyName;
    result = lines.join("\n");
  }

  return result;
}
