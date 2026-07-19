
export function parseLooseJson(
  raw: string,
  fallbackError: string
): Record<string, unknown> {
  const cleaned = stripMarkdownFences(raw);
  const candidates = [cleaned, extractBalancedObject(cleaned)].filter(
    (value): value is string => !!value
  );

  for (const candidate of candidates) {
    const parsed = tryParseObject(candidate);
    if (parsed) return parsed;

    const repaired = repairJsonStrings(candidate);
    const repairedParsed = tryParseObject(repaired);
    if (repairedParsed) return repairedParsed;
  }

  throw new Error(fallbackError);
}

function stripMarkdownFences(raw: string): string {
  return raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
}

function tryParseObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/** First top-level `{...}` with brace awareness inside strings. */
function extractBalancedObject(input: string): string | null {
  const start = input.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const char = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return input.slice(start, i + 1);
    }
  }

  return null;
}


function repairJsonStrings(input: string): string {
  let result = "";
  let inString = false;
  let parsingKey = true;
  let i = 0;

  while (i < input.length) {
    const char = input[i]!;

    if (!inString) {
      result += char;
      if (char === '"') {
        inString = true;
      } else if (char === ":") {
        parsingKey = false;
      } else if (char === "," || char === "{") {
        parsingKey = true;
      }
      i += 1;
      continue;
    }

    if (char === "\\") {
      const next = input[i + 1];
      if (next !== undefined) {
        result += char + next;
        i += 2;
      } else {
        result += "\\\\";
        i += 1;
      }
      continue;
    }

    if (char === '"') {
      if (isStringTerminator(input, i + 1, parsingKey)) {
        inString = false;
        result += char;
      } else {
        result += '\\"';
      }
      i += 1;
      continue;
    }

    if (char === "\n") {
      result += "\\n";
      i += 1;
      continue;
    }
    if (char === "\r") {
      result += "\\r";
      i += 1;
      continue;
    }
    if (char === "\t") {
      result += "\\t";
      i += 1;
      continue;
    }

    const code = char.charCodeAt(0);
    if (code < 0x20) {
      result += `\\u${code.toString(16).padStart(4, "0")}`;
      i += 1;
      continue;
    }

    result += char;
    i += 1;
  }

  return result.replace(/,\s*([}\]])/g, "$1");
}

function isStringTerminator(
  input: string,
  from: number,
  parsingKey: boolean
): boolean {
  let i = from;
  while (i < input.length && /\s/.test(input[i]!)) i += 1;
  if (i >= input.length) return true;
  const next = input[i]!;
  if (parsingKey) return next === ":";
  return next === "," || next === "}" || next === "]";
}
