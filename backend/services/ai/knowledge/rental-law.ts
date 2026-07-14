import type { KnowledgeFile } from "@/lib/types";

export const rentalLawKnowledge: KnowledgeFile = {
  version: "1.0",
  updatedAt: "2026-07-14",
  statutes: [
    {
      law: 'חוק השכירות והשאילה, תשל"א-1971',
      sections: ["השבת פיקדון עם תום השכירות", "ניכוי נזקים מוכחים בלבד"],
      appliesWhen: "אי-השבת פיקדון שכירות",
    },
    {
      law: 'חוק עשיית עושר ולא במשפט, תשל"ט-1979',
      sections: ["השבה"],
      appliesWhen: "החזקת פיקדון ללא עילה מוצדקת",
    },
  ],
};
