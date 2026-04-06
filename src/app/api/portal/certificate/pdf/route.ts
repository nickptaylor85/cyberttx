export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const participant = await db.ttxParticipant.findFirst({
    where: { sessionId, userId: user.id },
    include: {
      session: { select: { title: true, theme: true, difficulty: true, completedAt: true, mitreAttackIds: true, organization: { select: { name: true } } } },
      user: { select: { firstName: true, lastName: true, email: true } },
      answers: true,
    },
  });
  if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const s = participant.session;
  const correct = participant.answers.filter(a => a.isCorrect).length;
  const total = participant.answers.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const name = `${participant.user.firstName || ""} ${participant.user.lastName || ""}`.trim() || participant.user.email;
  const date = s.completedAt ? new Date(s.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-GB");
  const grade = accuracy >= 90 ? "PLATINUM" : accuracy >= 75 ? "GOLD" : accuracy >= 60 ? "SILVER" : "BRONZE";

  // Build PDF with pdf-lib (pure JS, works on Vercel)
  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const { width, height } = page.getSize();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const teal = rgb(0.078, 0.722, 0.604); // #14b89a
  const white = rgb(1, 1, 1);
  const gray = rgb(0.6, 0.6, 0.6);
  const dark = rgb(0.06, 0.06, 0.12);
  const gradeColors: Record<string, ReturnType<typeof rgb>> = {
    PLATINUM: rgb(0.655, 0.545, 0.98), GOLD: rgb(0.984, 0.749, 0.141),
    SILVER: rgb(0.612, 0.639, 0.686), BRONZE: rgb(0.851, 0.467, 0.024),
  };
  const gc = gradeColors[grade] || teal;

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: dark });

  // Border
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: teal, borderWidth: 2 });
  page.drawRectangle({ x: 36, y: 36, width: width - 72, height: height - 72, borderColor: rgb(0.078, 0.722, 0.604), borderWidth: 0.5, opacity: 0.3 });

  function centerText(text: string, y: number, font: typeof helvetica, size: number, color: ReturnType<typeof rgb>) {
    const tw = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - tw) / 2, y, font, size, color });
  }

  // Content
  centerText("THREATCAST", height - 100, helveticaBold, 14, teal);
  centerText("CERTIFICATE", height - 140, helvetica, 36, teal);
  centerText("OF COMPLETION", height - 165, helvetica, 11, gray);
  centerText("This certifies that", height - 200, helvetica, 11, gray);
  centerText(name, height - 230, helveticaBold, 26, teal);
  centerText("has successfully completed the cybersecurity tabletop exercise", height - 265, helvetica, 11, gray);
  centerText(`"${s.title}"`, height - 290, helveticaBold, 15, white);
  centerText(grade, height - 330, helveticaBold, 14, gc);
  centerText(`${accuracy}%`, height - 365, helveticaBold, 36, gc);
  centerText(`${correct}/${total} correct  |  ${s.difficulty}  |  ${s.theme}`, height - 400, helvetica, 10, gray);
  centerText(`${s.organization?.name || "ThreatCast"}  |  ${date}`, height - 420, helvetica, 10, gray);

  const mitre = (s.mitreAttackIds as string[]) || [];
  if (mitre.length) centerText(`MITRE ATT&CK: ${mitre.join(", ")}`, height - 450, helvetica, 8, rgb(0.4, 0.4, 0.4));

  centerText(`Issued by ThreatCast  |  threatcast.io  |  Certificate ID: TC-${sessionId.slice(-8).toUpperCase()}`, 50, helvetica, 8, rgb(0.35, 0.35, 0.35));

  // Save certificate to user profile
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_certificates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL, session_id TEXT NOT NULL,
        title TEXT, grade TEXT, accuracy INT, theme TEXT, org_name TEXT,
        earned_at TIMESTAMP DEFAULT NOW(), expires_at TIMESTAMP
      )
    `);
    const existing = await db.$queryRawUnsafe(`SELECT id FROM user_certificates WHERE user_id = $1 AND session_id = $2`, user.id, sessionId) as any[];
    if (!existing.length) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await db.$executeRawUnsafe(
        `INSERT INTO user_certificates (user_id, session_id, title, grade, accuracy, theme, org_name, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        user.id, sessionId, s.title, grade, accuracy, s.theme, s.organization?.name || "", expiresAt
      );
    }
  } catch {}

  const pdfBytes = await doc.save();
  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
