import type { Category, Tone, Goal } from "./types";
import { CATEGORIES, TONES, GOALS } from "./constants";

export function formatDate(date: Date): string {
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function todayFormatted(): string {
  return formatDate(new Date());
}

export function categoryLabel(category: Category): string {
  return CATEGORIES[category]?.label ?? category;
}

export function toneLabel(tone: Tone): string {
  return TONES[tone]?.label ?? tone;
}

export function goalLabel(goal: Goal): string {
  return GOALS[goal]?.label ?? goal;
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function extractFirstSentence(text: string): string {
  const sentence = text.split(/[.!?]/)[0];
  return sentence.length > 80 ? sentence.slice(0, 80) + "..." : sentence;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
