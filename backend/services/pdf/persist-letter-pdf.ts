import { prisma } from "@/backend/services/db/prisma";
import { renderPDF } from "@/backend/services/pdf/render";
import { loadAttorneySignatureDataUrl } from "@/backend/services/pdf/attorney-signature";
import {
  buildLetterPdfKey,
  isR2Configured,
  uploadEvidenceObject,
} from "@/backend/services/storage/r2";
import type { LetterInput } from "@/lib/types";

type PdfKind = "draft" | "signed";

export async function persistLetterPdf(opts: {
  leadId: string;
  kind: PdfKind;
  content: string;
  letterInput: LetterInput;
  fileName: string;
}): Promise<string | null> {
  if (!isR2Configured()) return null;

  const evidenceRows = await prisma.evidence.findMany({
    where: { leadId: opts.leadId },
    orderBy: { sortOrder: "asc" },
  });

  const signed = opts.kind === "signed";
  let signatureDataUrl: string | undefined;
  if (signed) {
    signatureDataUrl = await loadAttorneySignatureDataUrl();
  }

  const pdfBuffer = await renderPDF({
    letterInput: opts.letterInput,
    content: opts.content,
    withSignature: signed,
    attorneyVerified: signed,
    signatureDataUrl,
    evidence: evidenceRows.map((r) => ({
      label: r.label,
      fileName: r.fileName,
      mimeType: r.mimeType,
      r2Key: r.r2Key,
      description: r.description,
    })),
  });

  const key = buildLetterPdfKey(opts.leadId, opts.kind);
  await uploadEvidenceObject({
    key,
    body: pdfBuffer,
    contentType: "application/pdf",
  });

  await prisma.letter.update({
    where: { leadId: opts.leadId },
    data:
      opts.kind === "draft"
        ? { draftPdfR2Key: key, fileName: opts.fileName }
        : { signedPdfR2Key: key, fileName: opts.fileName },
  });

  return key;
}

export async function persistLetterPdfSafely(
  opts: Parameters<typeof persistLetterPdf>[0]
): Promise<string | null> {
  try {
    return await persistLetterPdf(opts);
  } catch (err) {
    console.error(
      `[persist-letter-pdf] ${opts.kind}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
