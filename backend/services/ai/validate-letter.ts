export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: "placeholder" | "missing_citation" | "forbidden_threat";
  detail: string;
}

const PLACEHOLDER_PATTERN = /\[[^\]]{2,}\]/g;

const PLACEHOLDER_WHITELIST = new Set([
  "[שם_נתבע]",
  "[חודש]",
  "[שנה]",
]);

const LEGAL_MARKERS = [
  "סעיף",
  "חוק",
  "פקודת",
  "תקנות",
  "צו",
  "תקנון",
];

const FORBIDDEN_THREAT_PATTERNS = [
  /דיווח\s+לרשויות\s+המס/,
  /פני[יה]ה?\s+לרשויות\s+המס/,
  /תלונה\s+במשטרה/,
  /תלונה\s+לרשויות/,
  /הליך\s+פלילי/,
  /הגשת\s+תלונה\s+פלילי/,
  /העברת\s+(ה)?מידע\s+לרשויות/,
  /דיווח\s+פלילי/,
  /פני[יה]ה?\s+לגורמים\s+פליליי?ם/,
  /פני[יה]ה?\s+למשטרה/,
  /רשויות\s+המס.*כאמצעי/,
  /רשויות\s+החוק.*לחץ/,
  /תישקול\s+פני[יה]ה?\s+לרשויות/,
  /ידווח\s+לרשויות/,
  /נפנה\s+לרשויות\s+המס/,
  /נדווח\s+למשטרה/,
];

export function validateLetter(content: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  const placeholders = findPlaceholders(content);
  for (const ph of placeholders) {
    issues.push({ type: "placeholder", detail: ph });
  }

  if (!hasLegalCitation(content)) {
    issues.push({ type: "missing_citation", detail: "המכתב לא מכיל ציטוט חוק או סעיף" });
  }

  const threats = findForbiddenThreats(content);
  for (const threat of threats) {
    issues.push({ type: "forbidden_threat", detail: threat });
  }

  return { valid: issues.length === 0, issues };
}

function findPlaceholders(content: string): string[] {
  const matches = content.match(PLACEHOLDER_PATTERN) || [];
  return matches.filter((m) => !PLACEHOLDER_WHITELIST.has(m));
}

function hasLegalCitation(content: string): boolean {
  return LEGAL_MARKERS.some((marker) => content.includes(marker));
}

function findForbiddenThreats(content: string): string[] {
  const found: string[] = [];
  for (const pattern of FORBIDDEN_THREAT_PATTERNS) {
    const match = content.match(pattern);
    if (match) found.push(match[0]);
  }
  return found;
}

export function buildRetryInstruction(issues: ValidationIssue[]): string {
  const lines: string[] = ["תקן את המכתב לפי ההנחיות הבאות:"];

  const hasPlaceholder = issues.some((i) => i.type === "placeholder");
  const hasMissingCitation = issues.some((i) => i.type === "missing_citation");
  const hasThreat = issues.some((i) => i.type === "forbidden_threat");

  if (hasPlaceholder) {
    const phs = issues.filter((i) => i.type === "placeholder").map((i) => i.detail);
    lines.push(`- הסר את הסוגריים המרובעים הבאים ונסח במקומם ניסוח גנרי משפטי: ${phs.join(", ")}`);
  }

  if (hasMissingCitation) {
    lines.push("- המכתב חייב לכלול ציטוט של לפחות סעיף חוק אחד מרשימת הידע המצורפת");
  }

  if (hasThreat) {
    const threats = issues.filter((i) => i.type === "forbidden_threat").map((i) => i.detail);
    lines.push(`- הסר לחלוטין את האיום הבא (סחיטה באיומים, עבירה פלילית): ${threats.join(", ")}. מותר רק: "שומר על זכותו לפנות לערכאות אזרחיות"`);
  }

  return lines.join("\n");
}
