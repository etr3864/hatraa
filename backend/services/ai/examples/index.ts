import type { Category } from "@/lib/types";
import { consumerExamples } from "./consumer";
import { bankingExamples } from "./banking";
import { employmentExamples } from "./employment";
import { rentalExamples } from "./rental";
import { tortExamples } from "./tort";

const EXAMPLES_BY_CATEGORY: Record<Category, readonly string[]> = {
  consumer: consumerExamples,
  banking: bankingExamples,
  employment: employmentExamples,
  rental: rentalExamples,
  tort: tortExamples,
};

export function getExamples(category: Category): readonly string[] {
  return EXAMPLES_BY_CATEGORY[category];
}

export function formatExamplesForPrompt(examples: readonly string[]): string {
  return examples
    .map((letter, i) => `--- דוגמה ${i + 1} ---\n${letter}`)
    .join("\n\n");
}
