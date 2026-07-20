import { ATTORNEY } from "@/lib/attorney";

interface SanitizeLetterOptions {
  senderName: string;
  senderPhone?: string;
  senderEmail?: string;
  attorneyVerified?: boolean;
}

const PLACEHOLDER_IN_BRACKETS = /\[[^\]]{2,}\]/g;

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

  if (options.attorneyVerified && !ATTORNEY.displayName.includes("להשלמה")) {
    result = enforceAttorneyIdentity(result, options.senderName, signatureName);
  } else if (options.senderPhone && options.senderEmail) {
    result = fillContactPlaceholders(
      result,
      options.senderPhone,
      options.senderEmail
    );
  }

  return result.replace(/\n{3,}/g, "\n\n").trim();
}

function fillContactPlaceholders(
  content: string,
  phone: string,
  email: string
): string {
  let result = content.replace(
    /\|\s*\[טלפון\]\s*\|\s*\[מייל\]/g,
    `| ${phone} | ${email}`
  );
  result = result.replace(/\[טלפון\]/g, phone);
  result = result.replace(/\[מייל\]/g, email);
  return result;
}

/**
 * After attorney rewrite: force header + closing signature to use attorney
 * identity, even when the model wrongly signed as the client.
 */
function enforceAttorneyIdentity(
  content: string,
  clientName: string,
  attorneyName: string
): string {
  let result = content;

  result = replaceClosingSignature(result, clientName, attorneyName);
  result = replaceOpeningSender(result, clientName, attorneyName);
  result = stripOrphanSignatureWords(result);

  return result;
}

function clientNameVariants(clientName: string): string[] {
  const trimmed = clientName.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const variants = new Set<string>([trimmed]);
  if (parts[0]) variants.add(parts[0]);
  if (parts.length > 1) variants.add(parts[parts.length - 1]!);
  return [...variants].sort((a, b) => b.length - a.length);
}

function replaceClosingSignature(
  content: string,
  clientName: string,
  attorneyName: string
): string {
  const variants = clientNameVariants(clientName);
  let result = content;

  for (const name of variants) {
    const escaped = escapeRegex(name);
    const pattern = new RegExp(
      `(בכבוד רב[,،]?)(\\s*\\n+\\s*)(${escaped})(\\s*)$`,
      "im"
    );
    if (pattern.test(result)) {
      return result.replace(pattern, `$1$2${attorneyName}$4`);
    }
  }

  // Fallback: any name after "בכבוד רב" at the end → attorney
  const fallback = /(בכבוד רב[,،]?)(\s*\n+\s*)([^\n]{1,80})(\s*)$/im;
  if (fallback.test(result)) {
    return result.replace(fallback, `$1$2${attorneyName}$4`);
  }

  return result;
}

function replaceOpeningSender(
  content: string,
  clientName: string,
  attorneyName: string
): string {
  const lines = content.split("\n");
  if (lines.length === 0) return content;

  const first = lines[0]?.trim() ?? "";
  const variants = clientNameVariants(clientName);

  if (variants.some((name) => first === name || first === `מר ${name}`)) {
    lines[0] = attorneyName;
    return lines.join("\n");
  }

  // "איתן | טלפון | מייל" or "איתן  כתובת: ..."
  for (const name of variants) {
    const escaped = escapeRegex(name);
    const headed = new RegExp(`^${escaped}(\\s*[|\\|].*)?$`);
    if (headed.test(first)) {
      lines[0] = attorneyName + (first.match(/[|\\|].*$/)?.[0] ?? "");
      return lines.join("\n");
    }
  }

  return content;
}

function stripOrphanSignatureWords(content: string): string {
  return content
    .replace(/\nחתימת\s*$/im, "")
    .replace(/\nחתימה\s*$/im, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
