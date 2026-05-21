import { CONSUMER_TEMPLATE } from "./consumer";
import { EMPLOYMENT_TEMPLATE } from "./employment";
import { RENTAL_TEMPLATE } from "./rental";
import { TORT_TEMPLATE } from "./tort";
import type { Category } from "@/lib/types";

const TEMPLATES: Record<Category, string> = {
  consumer: CONSUMER_TEMPLATE,
  employment: EMPLOYMENT_TEMPLATE,
  rental: RENTAL_TEMPLATE,
  tort: TORT_TEMPLATE,
};

export function getTemplate(category: Category): string {
  return TEMPLATES[category];
}
