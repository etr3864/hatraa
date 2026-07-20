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

  return result.replace(/\n{3,}/g, "\n\n").trim();
}
