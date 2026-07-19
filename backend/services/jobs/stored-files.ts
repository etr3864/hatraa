import { prisma } from "@/backend/services/db/prisma";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import { getEvidenceBuffer } from "@/backend/services/storage/r2";
import { evidenceLabel } from "@/lib/evidence-labels";
import type {
  EvidenceFile,
  StoredFileReference,
} from "@/lib/types";

export async function loadStoredEvidence(
  files: StoredFileReference[]
): Promise<EvidenceFile[]> {
  return Promise.all(
    files.map(async (file) => {
      const { buffer, contentType } = await getEvidenceBuffer(file.key);
      return {
        name: file.name,
        type: contentType || file.type,
        base64: buffer.toString("base64"),
        description: file.description,
        storage: file,
      };
    })
  );
}

export async function loadStoredAudio(file: StoredFileReference) {
  const { buffer, contentType } = await getEvidenceBuffer(file.key);
  return {
    base64: buffer.toString("base64"),
    mimeType: contentType || file.type,
  };
}

export async function persistStoredEvidence(
  leadId: string,
  files: StoredFileReference[]
): Promise<void> {
  await Promise.all(
    files.map((file, index) =>
      prisma.evidence.upsert({
        where: { r2Key: file.key },
        create: {
          leadId,
          label: evidenceLabel(index),
          fileName: sanitizeInput(file.name).slice(0, 120),
          mimeType: file.type,
          sizeBytes: file.sizeBytes,
          r2Key: file.key,
          description: file.description
            ? sanitizeInput(file.description).slice(0, 500)
            : null,
          sortOrder: index,
        },
        update: {
          leadId,
          description: file.description
            ? sanitizeInput(file.description).slice(0, 500)
            : null,
          sortOrder: index,
        },
      })
    )
  );
}

