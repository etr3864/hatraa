import type { Category, KnowledgeFile } from "@/lib/types";
import { consumerLawKnowledge } from "./consumer-law";
import { bankingLawKnowledge } from "./banking-law";
import { employmentLawKnowledge } from "./employment-law";
import { rentalLawKnowledge } from "./rental-law";
import { tortLawKnowledge } from "./tort-law";

const KNOWLEDGE_BY_CATEGORY: Record<Category, KnowledgeFile> = {
  consumer: consumerLawKnowledge,
  banking: bankingLawKnowledge,
  employment: employmentLawKnowledge,
  rental: rentalLawKnowledge,
  tort: tortLawKnowledge,
};

export function getKnowledge(category: Category): KnowledgeFile {
  return KNOWLEDGE_BY_CATEGORY[category];
}

export function formatKnowledgeForPrompt(knowledge: KnowledgeFile): string {
  return knowledge.statutes
    .map(
      (s) =>
        `- ${s.law}\n  סעיפים: ${s.sections.join(", ")}\n  מתי רלוונטי: ${s.appliesWhen}`
    )
    .join("\n");
}
