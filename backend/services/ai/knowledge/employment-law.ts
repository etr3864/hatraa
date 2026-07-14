import type { KnowledgeFile } from "@/lib/types";

export const employmentLawKnowledge: KnowledgeFile = {
  version: "1.0",
  updatedAt: "2026-07-14",
  statutes: [
    {
      law: 'חוק הגנת השכר, תשי"ח-1958',
      sections: ["תשלום מלוא השכר במועדו", "פיצויי הלנת שכר"],
      appliesWhen: "אי-תשלום שכר, הלנת שכר",
    },
    {
      law: 'חוק פיצויי פיטורים, תשכ"ג-1963',
      sections: ["תשלום פיצויים עם סיום העסקה"],
      appliesWhen: "סיום העסקה ללא תשלום פיצויי פיטורים",
    },
  ],
};
