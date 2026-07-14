import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { validateAdminToken } from "@/backend/services/security/admin-auth";
import { decryptLeadPii, encryptLeadPii } from "@/backend/services/security/encryption";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import { VALID_CATEGORIES } from "@/lib/constants";
import type { Category } from "@/lib/types";

interface UpdateLeadBody {
  name?: string;
  idNumber?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  letter?: {
    category?: string;
    rawInput?: string;
    respondentName?: string;
    respondentAddress?: string | null;
    eventDate?: string | null;
    amount?: string | null;
    tone?: string;
    goal?: string;
    content?: string;
    fileName?: string;
  };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateAdminToken(req)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });
    }

    const existing = await prisma.lead.findUnique({
      where: { id },
      include: { letter: true, payment: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "ליד לא נמצא" }, { status: 404 });
    }

    const body = (await req.json()) as UpdateLeadBody;
    const decrypted = decryptLeadPii(existing);

    const nextPii = encryptLeadPii({
      name: sanitizeInput(body.name ?? decrypted.name),
      idNumber:
        body.idNumber === undefined
          ? decrypted.idNumber
          : body.idNumber
            ? sanitizeInput(body.idNumber)
            : null,
      address: sanitizeInput(body.address ?? decrypted.address),
      phone: sanitizeInput(body.phone ?? decrypted.phone),
      email: sanitizeInput(body.email ?? decrypted.email),
    });

    if (body.letter?.category && !VALID_CATEGORIES.includes(body.letter.category as Category)) {
      return NextResponse.json({ error: "קטגוריה לא תקינה" }, { status: 400 });
    }

    const letterUpdate = body.letter
      ? {
          ...(body.letter.category !== undefined && { category: body.letter.category }),
          ...(body.letter.rawInput !== undefined && {
            rawInput: sanitizeInput(body.letter.rawInput),
          }),
          ...(body.letter.respondentName !== undefined && {
            respondentName: sanitizeInput(body.letter.respondentName),
          }),
          ...(body.letter.respondentAddress !== undefined && {
            respondentAddress: body.letter.respondentAddress
              ? sanitizeInput(body.letter.respondentAddress)
              : null,
          }),
          ...(body.letter.eventDate !== undefined && {
            eventDate: body.letter.eventDate ? sanitizeInput(body.letter.eventDate) : null,
          }),
          ...(body.letter.amount !== undefined && {
            amount: body.letter.amount ? sanitizeInput(body.letter.amount) : null,
          }),
          ...(body.letter.tone !== undefined && { tone: body.letter.tone }),
          ...(body.letter.goal !== undefined && { goal: body.letter.goal }),
          ...(body.letter.content !== undefined && {
            content: sanitizeInput(body.letter.content),
          }),
          ...(body.letter.fileName !== undefined && {
            fileName: sanitizeInput(body.letter.fileName),
          }),
        }
      : undefined;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        name: nextPii.name,
        idNumber: nextPii.idNumber,
        address: nextPii.address,
        phone: nextPii.phone,
        email: nextPii.email,
        ...(letterUpdate && existing.letter
          ? { letter: { update: letterUpdate } }
          : {}),
      },
      include: { letter: true, payment: true },
    });

    return NextResponse.json({ lead: decryptLeadPii(updated) });
  } catch (err) {
    console.error("[leads:patch]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "שגיאה בעדכון הליד" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateAdminToken(req)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });
    }

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ליד לא נמצא" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { leadId: id } }),
      prisma.letter.deleteMany({ where: { leadId: id } }),
      prisma.lead.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[leads:delete]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "שגיאה במחיקת הליד" }, { status: 500 });
  }
}
