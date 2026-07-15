import type { StatuteEntry } from "@/lib/types";

export const utilitiesStatutes: StatuteEntry[] = [
  {
    law: 'חוק תאגידי מים וביוב, התשס"א-2001',
    sections: ["חובת שירות", "בירור חיוב וצריכה חריגה"],
    appliesWhen: "חשבון מים או ביוב של תאגיד מים",
  },
  {
    law: 'חוק משק החשמל, התשנ"ו-1996',
    sections: [
      "סעיף 17 — אמות מידה לשירות",
      "סעיפים 30 ו-33 — ספק שירות חיוני וניתוק",
    ],
    appliesWhen: "ניתוק חשמל, איכות שירות או נזק מחברת חשמל",
  },
];
