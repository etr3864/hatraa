import type { KnowledgeFile } from "@/lib/types";

export const tortLawKnowledge: KnowledgeFile = {
  version: "1.0",
  updatedAt: "2026-07-14",
  statutes: [
    {
      law: "סעיף 35 לפקודת הנזיקין",
      sections: ["חובת זהירות", "רשלנות"],
      appliesWhen: "נזק שנגרם ברשלנות (למשל נזקי מים משכן)",
    },
    {
      law: 'סעיף 44 לחוק המקרקעין, תשכ"ט-1969',
      sections: ["איסור גרימת נזק לנכס השכן"],
      appliesWhen: "נזק לנכס שכן ממקרקעין",
    },
    {
      law: 'חוק מניעת מפגעים, התשכ"א-1961',
      sections: ["איסור גרימת רעש חורג מהרמה הסבירה"],
      appliesWhen: "רעש / מטרד משכן",
    },
    {
      law: "סעיף 44 לפקודת הנזיקין",
      sections: ["מטרד לתושב"],
      appliesWhen: "מטרד המקנה סעד משפטי",
    },
  ],
};
