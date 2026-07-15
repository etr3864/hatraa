import type { KnowledgeFile } from "@/lib/types";
import { municipalStatutes } from "./municipal";
import { arnonaStatutes } from "./arnona";
import { planningStatutes } from "./planning";
import { adminStatutes } from "./admin";
import { utilitiesStatutes } from "./utilities";
import { nationalStatutes } from "./national";

export const authoritiesLawKnowledge: KnowledgeFile = {
  version: "1.0",
  updatedAt: "2026-07-15",
  statutes: [
    ...municipalStatutes,
    ...arnonaStatutes,
    ...planningStatutes,
    ...adminStatutes,
    ...utilitiesStatutes,
    ...nationalStatutes,
  ],
};
