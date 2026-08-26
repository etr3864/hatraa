import { prisma } from "@/backend/services/db/prisma";

export class LeadAccessError extends Error {
  constructor(message = "אין הרשאה") {
    super(message);
    this.name = "LeadAccessError";
  }
}

export async function assertLeadSessionAccess(
  leadId: string,
  sessionId: string | null
): Promise<void> {
  if (!sessionId) {
    throw new LeadAccessError();
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, analyticsSessionId: sessionId },
    select: { id: true },
  });
  if (!lead) {
    throw new LeadAccessError();
  }
}
