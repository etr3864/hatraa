import type { KnowledgeFile, VerificationResult } from "@/lib/types";


export function extractCitations(content: string): string[] {
  const patterns = [
    /סעיף\s+[\dא-ת"'״]+(?:\([^)]+\))?\s+ל(?:חוק|פקודת|תקנות)[^.\n]{0,80}/g,
    /חוק\s+[^.\n,]{2,90}(?:,\s*תש[^\s,.]*)?/g,
    /פקודת\s+[^.\n,]{2,60}/g,
    /תקנות\s+[^.\n,]{2,90}/g,
  ];

  const found = new Set<string>();
  for (const pattern of patterns) {
    const matches = content.match(pattern) ?? [];
    for (const m of matches) {
      found.add(m.trim());
    }
  }
  return Array.from(found);
}

function normalize(text: string): string {
  return text
    .replace(/["״''׳]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function citationMatchesKnowledge(citation: string, knowledge: KnowledgeFile): boolean {
  const nCitation = normalize(citation);
  return knowledge.statutes.some((statute) => {
    const nLaw = normalize(statute.law);
    if (nCitation.includes(nLaw) || nLaw.includes(nCitation.slice(0, Math.min(40, nCitation.length)))) {
      return true;
    }
    // partial: law name core without year
    const lawCore = nLaw.split(",")[0]?.trim() ?? nLaw;
    if (lawCore.length >= 8 && nCitation.includes(lawCore)) {
      return true;
    }
    return statute.sections.some((section) => {
      const nSection = normalize(section);
      return nSection.length >= 4 && nCitation.includes(nSection);
    });
  });
}

export function verifyLetter(content: string, knowledge: KnowledgeFile): VerificationResult {
  const citations = extractCitations(content);
  const invalidCitations = citations.filter((c) => !citationMatchesKnowledge(c, knowledge));
  return {
    verified: invalidCitations.length === 0,
    invalidCitations,
  };
}


export function stripLegalCitations(content: string): string {
  const paragraphs = content.split(/\n\s*\n/);
  const kept = paragraphs.filter((p) => {
    const citations = extractCitations(p);
    if (citations.length > 0) return false;
    if (/^\s*הבסיס המשפטי\s*:?\s*$/i.test(p.trim())) return false;
    return true;
  });

  return kept
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
