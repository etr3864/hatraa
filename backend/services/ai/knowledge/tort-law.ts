import type { KnowledgeFile } from "@/lib/types";

export const tortLawKnowledge: KnowledgeFile = {
  version: "1.1",
  updatedAt: "2026-07-15",
  statutes: [
    {
      law: "סעיף 35 לפקודת הנזיקין",
      sections: ["חובת זהירות", "רשלנות"],
      appliesWhen: "נזק ברשלנות שאינו סכסוך שכנים בבית משותף",
    },
    {
      law: "סעיף 36 לפקודת הנזיקין",
      sections: ["חובת זהירות כלפי אדם ונכס"],
      appliesWhen: "ביסוס חובת זהירות בעוולת רשלנות",
    },
    {
      law: "סעיף 44 לפקודת הנזיקין",
      sections: ["מטרד ליחיד"],
      appliesWhen: "מטרד שאינו סכסוך שכנים קלאסי",
    },
    {
      law: 'חוק למניעת מפגעים, התשכ"א-1961',
      sections: ["סעיף 2 — רעש", "סעיף 3 — ריח"],
      appliesWhen: "מפגע רעש או ריח ממקור שאינו שכן דירה",
    },
  ],
};
