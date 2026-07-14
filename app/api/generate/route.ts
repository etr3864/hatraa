import { NextRequest, NextResponse } from "next/server";
import { generateLetter } from "@/backend/services/ai/generate";
import { prisma } from "@/backend/services/db/prisma";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import { encryptLeadPii } from "@/backend/services/security/encryption";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import { VALID_CATEGORIES } from "@/lib/constants";
import type { LetterInput, EvidenceFile, Category } from "@/lib/types";
import { persistLeadEvidence } from "@/backend/services/storage/persist-evidence";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "הגעת למגבלה היומית, נסה שוב מחר." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as LetterInput & {
      extractedData: Record<string, unknown>;
      rawInput: string;
      evidence?: EvidenceFile[];
    };

    const {
      category,
      respondentName,
      respondentAddress,
      eventDate,
      amount,
      description,
      tone,
      goal,
      rawInput,
      extractedData,
      senderName,
      senderAddress,
      senderPhone,
      senderEmail,
      senderIdNumber,
      senderType,
      companyName,
      companyNumber,
      signatoryRole,
      evidence,
    } = body;

    if (!category || !respondentName || !description || !tone || !goal || !senderName || !senderEmail) {
      return NextResponse.json({ error: "חסרים פרטים נדרשים" }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category as Category)) {
      return NextResponse.json({ error: "קטגוריה לא תקינה" }, { status: 400 });
    }

    const letterInput: LetterInput = {
      category: category as Category,
      respondentName: sanitizeInput(respondentName),
      respondentAddress: respondentAddress ? sanitizeInput(respondentAddress) : undefined,
      eventDate: eventDate ? sanitizeInput(eventDate) : undefined,
      amount: amount ? sanitizeInput(amount) : undefined,
      description: sanitizeInput(description),
      tone,
      goal,
      rawInput: sanitizeInput(rawInput || description),
      senderType: senderType || "individual",
      senderName: sanitizeInput(senderName),
      senderAddress: sanitizeInput(senderAddress || ""),
      senderPhone: sanitizeInput(senderPhone || ""),
      senderEmail: sanitizeInput(senderEmail),
      senderIdNumber: senderIdNumber ? sanitizeInput(senderIdNumber) : undefined,
      companyName: companyName ? sanitizeInput(companyName) : undefined,
      companyNumber: companyNumber ? sanitizeInput(companyNumber) : undefined,
      signatoryRole: signatoryRole ? sanitizeInput(signatoryRole) : undefined,
      evidence: evidence || undefined,
    };

    const letterOutput = await generateLetter(letterInput);

    const leadName =
      senderType === "company" && companyName
        ? `${companyName} (${senderName})`
        : senderName;

    const pii = encryptLeadPii({
      name: leadName,
      idNumber: senderType === "company" ? companyNumber || null : senderIdNumber || null,
      address: letterInput.senderAddress,
      phone: letterInput.senderPhone,
      email: letterInput.senderEmail,
    });

    const lead = await prisma.lead.create({
      data: {
        name: pii.name,
        idNumber: pii.idNumber,
        address: pii.address,
        phone: pii.phone,
        email: pii.email,
        letter: {
          create: {
            category: letterInput.category,
            rawInput: letterInput.rawInput || letterInput.description,
            extractedData: JSON.parse(JSON.stringify(extractedData ?? {})),
            respondentName: letterInput.respondentName,
            respondentAddress: letterInput.respondentAddress || null,
            eventDate: letterInput.eventDate || null,
            amount: letterInput.amount || null,
            tone,
            goal,
            content: letterOutput.content,
            upsellMessage: letterOutput.upsellMessage,
            fileName: letterOutput.fileName,
            knowledgeVersion: letterOutput.knowledgeVersion,
            promptSnapshot: letterOutput.promptSnapshot,
            modelResponse: letterOutput.modelResponse,
            verified: letterOutput.verified,
          },
        },
      },
    });

    await persistLeadEvidence(lead.id, evidence);

    const letter = await prisma.letter.findUnique({ where: { leadId: lead.id } });

    return NextResponse.json({
      leadId: lead.id,
      letterId: letter?.id ?? null,
      content: letterOutput.content,
      upsellMessage: letterOutput.upsellMessage,
      fileName: letterOutput.fileName,
    });
  } catch (err) {
    console.error("[generate]", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "אירעה שגיאה, נסה שוב.";
    const isUserFacing =
      message.includes("שגיאה") ||
      message.includes("אנא") ||
      message.includes("נסה") ||
      message.includes("חסרים");
    return NextResponse.json(
      { error: isUserFacing ? message : "אירעה שגיאה, נסה שוב." },
      { status: 500 }
    );
  }
}
