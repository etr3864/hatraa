import { prisma } from "@/backend/services/db/prisma";

const MAX_BULK_DELETE = 100;

export async function deleteLeadsByIds(ids: string[]): Promise<{
  deleted: number;
  requested: number;
}> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { deleted: 0, requested: 0 };
  }
  if (uniqueIds.length > MAX_BULK_DELETE) {
    throw new Error(`ניתן למחוק עד ${MAX_BULK_DELETE} לידים בפעם אחת`);
  }

  const existing = await prisma.lead.findMany({
    where: { id: { in: uniqueIds } },
    include: { evidence: { select: { r2Key: true } } },
  });
  if (existing.length === 0) {
    return { deleted: 0, requested: uniqueIds.length };
  }

  const keys = existing.flatMap((lead) => lead.evidence.map((e) => e.r2Key));
  if (keys.length > 0) {
    try {
      const { deleteEvidenceObjects, isR2Configured } = await import(
        "@/backend/services/storage/r2"
      );
      if (isR2Configured()) {
        await deleteEvidenceObjects(keys);
      }
    } catch (err) {
      console.error(
        "[leads:delete] r2:",
        err instanceof Error ? err.message : err
      );
    }
  }

  const idsToDelete = existing.map((lead) => lead.id);
  await prisma.$transaction([
    prisma.payment.deleteMany({ where: { leadId: { in: idsToDelete } } }),
    prisma.letter.deleteMany({ where: { leadId: { in: idsToDelete } } }),
    prisma.evidence.deleteMany({ where: { leadId: { in: idsToDelete } } }),
    prisma.lead.deleteMany({ where: { id: { in: idsToDelete } } }),
  ]);

  return { deleted: idsToDelete.length, requested: uniqueIds.length };
}

export { MAX_BULK_DELETE };
