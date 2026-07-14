import type { EvidenceFile } from "@/lib/types";
import {
  buildEvidenceKey,
  uploadEvidenceObject,
  isR2Configured,
} from "@/backend/services/storage/r2";
import { prisma } from "@/backend/services/db/prisma";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import { evidenceLabel } from "@/lib/evidence-labels";

export async function persistLeadEvidence(
  leadId: string,
  files: EvidenceFile[] | undefined
): Promise<number> {
  if (!files?.length) return 0;
  if (!isR2Configured()) {
    console.error("[evidence] R2 לא מוגדר - הראיות לא נשמרו");
    return 0;
  }

  let saved = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file?.base64 || !file.name || !file.type) continue;

    const body = Buffer.from(file.base64, "base64");
    const key = buildEvidenceKey(leadId, file.name, i);

    try {
      await uploadEvidenceObject({
        key,
        body,
        contentType: file.type,
      });

      await prisma.evidence.create({
        data: {
          leadId,
          label: evidenceLabel(i),
          fileName: sanitizeInput(file.name).slice(0, 200),
          mimeType: file.type.slice(0, 120),
          sizeBytes: body.length,
          r2Key: key,
          description: file.description
            ? sanitizeInput(file.description).slice(0, 500)
            : null,
          sortOrder: i,
        },
      });
      saved += 1;
    } catch (err) {
      console.error(
        "[evidence] upload failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return saved;
}
