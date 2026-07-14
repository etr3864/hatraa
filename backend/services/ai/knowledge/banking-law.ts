import type { KnowledgeFile } from "@/lib/types";

export const bankingLawKnowledge: KnowledgeFile = {
  version: "1.0",
  updatedAt: "2026-07-14",
  statutes: [
    {
      law: 'חוק הבנקאות (שירות ללקוח), תשמ"א-1981',
      sections: ["שקיפות מלאה", "איסור גביית עמלות שלא הוסכמו מראש"],
      appliesWhen: "חיוב שגוי, עמלה חד-צדדית, הפרת תנאי ניהול חשבון",
    },
  ],
};
