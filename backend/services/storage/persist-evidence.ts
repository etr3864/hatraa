import type { EvidenceFile } from "@/lib/types";
import {
  buildEvidenceKey,
  uploadEvidenceObject,
  isR2Configured,
} from "@/backend/services/storage/r2";
import { prisma } from "@/backend/services/db/prisma";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import { evidenceLabel } from "@/lib/evidence-labels";
import {
  normalizeEvidenceMime,
  isSupportedEvidenceMime,
  shortenFileName,
} from "@/lib/evidence-mime";

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
    if (!file?.base64 || !file.name) continue;

    const mime = normalizeEvidenceMime(file.type, file.name);
    if (!isSupportedEvidenceMime(mime)) continue;

    const safeName = shortenFileName(sanitizeInput(file.name), 120);
    const body = Buffer.from(file.base64, "base64");
    const key = buildEvidenceKey(leadId, safeName, i);

    try {
      await uploadEvidenceObject({
        key,
        body,
        contentType: mime,
      });

      await prisma.evidence.create({
        data: {
          leadId,
          label: evidenceLabel(i),
          fileName: safeName,
          mimeType: mime,
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
