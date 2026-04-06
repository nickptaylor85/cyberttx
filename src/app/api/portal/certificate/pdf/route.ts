export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import PDFDocument from "pdfkit";

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

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => { doc.on("end", () => resolve(Buffer.concat(chunks))); });

  const w = 841; const h = 595; // A4 landscape
  // Background
  doc.rect(0, 0, w, h).fill("#0f0f1e");
  // Border
  doc.rect(30, 30, w - 60, h - 60).lineWidth(2).strokeColor("#14b89a").stroke();
  doc.rect(36, 36, w - 72, h - 72).lineWidth(0.5).strokeColor("#14b89a").strokeOpacity(0.3).stroke();

  // Content
  const cx = w / 2;
  doc.fillColor("#14b89a").fontSize(14).text("THREATCAST", 0, 80, { align: "center", width: w });
  doc.fillColor("#14b89a").fontSize(36).text("CERTIFICATE", 0, 120, { align: "center", width: w, characterSpacing: 6 });
  doc.fillColor("#888").fontSize(12).text("OF COMPLETION", 0, 165, { align: "center", width: w, characterSpacing: 4 });
  doc.fillColor("#ccc").fontSize(11).text("This certifies that", 0, 200, { align: "center", width: w });
  doc.fillColor("#14b89a").fontSize(28).text(name, 0, 225, { align: "center", width: w });
  doc.fillColor("#ccc").fontSize(11).text("has successfully completed the cybersecurity tabletop exercise", 0, 270, { align: "center", width: w });
  doc.fillColor("#fff").fontSize(16).text(`"${s.title}"`, 0, 295, { align: "center", width: w });

  // Grade + Score
  doc.fillColor("#14b89a").fontSize(14).text(grade, 0, 340, { align: "center", width: w, characterSpacing: 4 });
  doc.fillColor("#fff").fontSize(36).text(`${accuracy}%`, 0, 365, { align: "center", width: w });
  doc.fillColor("#999").fontSize(10).text(`${correct}/${total} correct · ${s.difficulty} · ${s.theme}`, 0, 410, { align: "center", width: w });
  doc.fillColor("#999").fontSize(10).text(`${s.organization?.name || "ThreatCast"} · ${date}`, 0, 430, { align: "center", width: w });

  // MITRE
  const mitre = (s.mitreAttackIds as string[]) || [];
  if (mitre.length) doc.fillColor("#666").fontSize(8).text(`MITRE ATT&CK: ${mitre.join(", ")}`, 0, 460, { align: "center", width: w });

  // Footer
  doc.fillColor("#555").fontSize(8).text(`Issued by ThreatCast · threatcast.io · Certificate ID: TC-${sessionId.slice(-8).toUpperCase()}`, 0, h - 55, { align: "center", width: w });
  doc.end();

  // Store certificate on user profile
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_certificates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        title TEXT,
        grade TEXT,
        accuracy INT,
        theme TEXT,
        org_name TEXT,
        earned_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `);
    // Check if already exists
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

  const pdf = await done;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
