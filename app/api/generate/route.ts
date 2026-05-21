import { NextRequest, NextResponse } from "next/server";
import { generateLetter } from "@/backend/services/ai/generate";
import { prisma } from "@/backend/services/db/prisma";
import type { LetterInput, EvidenceFile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LetterInput & {
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
      return NextResponse.json(
        { error: "חסרים פרטים נדרשים" },
        { status: 400 }
      );
    }

    const letterInput: LetterInput = {
      category,
      respondentName,
      respondentAddress,
      eventDate,
      amount,
      description,
      tone,
      goal,
      rawInput,
      senderType: senderType || "individual",
      senderName,
      senderAddress,
      senderPhone,
      senderEmail,
      senderIdNumber,
      companyName,
      companyNumber,
      signatoryRole,
      evidence: evidence || undefined,
    };

    const letterOutput = await generateLetter(letterInput);

    // Save lead + letter to DB — non-blocking, don't fail the response if DB is unavailable
    let leadId: string | null = null;
    let letterId: string | null = null;

    try {
      const leadName = senderType === "company" && companyName
        ? `${companyName} (${senderName})`
        : senderName;

      const lead = await prisma.lead.create({
        data: {
          name: leadName,
          idNumber: senderType === "company" ? (companyNumber || null) : (senderIdNumber || null),
          address: senderAddress,
          phone: senderPhone,
          email: senderEmail,
          letter: {
            create: {
              category,
              rawInput: rawInput || description,
              extractedData: JSON.parse(JSON.stringify(extractedData ?? {})),
              respondentName,
              respondentAddress: respondentAddress || null,
              eventDate: eventDate || null,
              amount: amount || null,
              tone,
              goal,
              content: letterOutput.content,
              upsellMessage: letterOutput.upsellMessage,
              fileName: letterOutput.fileName,
            },
          },
        },
      });

      leadId = lead.id;
      const letter = await prisma.letter.findUnique({ where: { leadId: lead.id } });
      letterId = letter?.id ?? null;
    } catch (dbErr) {
      // DB not available — log and continue. Letter is still returned to user.
      console.error("[generate] DB save failed:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    return NextResponse.json({
      leadId: leadId ?? "no-db",
      letterId: letterId ?? null,
      content: letterOutput.content,
      upsellMessage: letterOutput.upsellMessage,
      fileName: letterOutput.fileName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בייצור המכתב";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
