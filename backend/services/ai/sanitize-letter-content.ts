import { ATTORNEY } from "@/lib/attorney";

interface SanitizeLetterOptions {
  senderName: string;
  senderPhone?: string;
  senderEmail?: string;
  attorneyVerified?: boolean;
  /** PDF already has parties + signature blocks — strip duplicate letterhead */
  forPdf?: boolean;
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
  const attorneyName = ATTORNEY.displayName;
  const signatureName = options.attorneyVerified
    ? attorneyName
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

  if (options.attorneyVerified) {
    result = enforceAttorneyIdentity(result, options.senderName, attorneyName);
    if (options.forPdf) {
      result = stripLetterheadAndClosingForPdf(result);
    }
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

/**
 * PDF template already renders parties (מאת/אל) and signature.
 * Remove AI-duplicated letterhead + closing so they don't appear twice.
 */
function stripLetterheadAndClosingForPdf(content: string): string {
  let result = content;

  // Drop trailing "בכבוד רב" signature — PDF signature block owns this
  result = result.replace(
    /\n*בכבוד רב[,،]?[\s\S]*$/i,
    ""
  );

  // Drop leading letterhead until הנדון / א.נ. / שלום / הריני / הנני
  const bodyStart = result.search(
    /(?:^|\n)(?:הנדון\s*:|א\.?\s*נ\.?\s*[,،]|שלום\s*רב|הריני\s|הנני\s)/m
  );
  if (bodyStart > 0) {
    result = result.slice(bodyStart).replace(/^\n+/, "");
  }

  return result.trim();
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

  for (const name of variants) {
    const escaped = escapeRegex(name);
    const pattern = new RegExp(
      `(בכבוד רב[,،]?)(\\s*\\n+\\s*)(${escaped})(\\s*)$`,
      "im"
    );
    if (pattern.test(content)) {
      return content.replace(pattern, `$1$2${attorneyName}$4`);
    }
  }

  // Company closing: "בכבוד רב,\nCompany\nrole: name\nemail | phone"
  const companyClosing =
    /(בכבוד רב[,،]?)(\s*\n+)([\s\S]{1,200}?)(\s*)$/im;
  if (companyClosing.test(content)) {
    const match = content.match(companyClosing);
    if (match && /@|טלפון|דירקטור|בע["״]?מ/.test(match[3] ?? "")) {
      return content.replace(companyClosing, `$1$2${attorneyName}$4`);
    }
  }

  const fallback = /(בכבוד רב[,،]?)(\s*\n+\s*)([^\n]{1,80})(\s*)$/im;
  if (fallback.test(content)) {
    return content.replace(fallback, `$1$2${attorneyName}$4`);
  }

  return content;
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

  for (const name of variants) {
    const escaped = escapeRegex(name);
    const headed = new RegExp(`^${escaped}(\\s*[|\\|].*)?$`);
    if (headed.test(first)) {
      lines[0] = attorneyName + (first.match(/[|\\|].*$/)?.[0] ?? "");
      return lines.join("\n");
    }
  }

  // Company letterhead first line
  if (/בע["״]?מ|חברה/.test(first) && !first.includes("עו")) {
    lines[0] = attorneyName;
    return lines.join("\n");
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
