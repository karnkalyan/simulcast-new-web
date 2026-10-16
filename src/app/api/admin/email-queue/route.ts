import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getEmailQueue, enqueueEmail, enqueueBulkEmails, clearEmailQueue } from "@/lib/email-queue";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const batchId = searchParams.get("batchId") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const data = await getEmailQueue({ status, batchId, limit });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { to, recipients, subject, html, text, attachments, batchName, priority = 0, isBulk } = body;

    if (isBulk && Array.isArray(recipients)) {
      const result = await enqueueBulkEmails({
        recipients,
        subject,
        html,
        text,
        attachments,
        batchName,
        source: "ADMIN",
        clientIdentity: session.email,
        priority: Number(priority),
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields (to, subject, html)" }, { status: 400 });
    }

    const item = await enqueueEmail({
      to,
      subject,
      html,
      text,
      attachments,
      priority: Number(priority),
      source: "ADMIN",
      clientIdentity: session.email,
    });

    await logAudit({
      action: "EMAIL_QUEUED_ADMIN",
      category: "EMAIL",
      actor: session.email,
      target: Array.isArray(to) ? to.join(", ") : to,
      details: `Queued email #${item.id} with subject "${subject}"`,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to enqueue email: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as "SENT" | "FAILED" | "ALL") || "ALL";

  const result = await clearEmailQueue(status);
  return NextResponse.json(result);
}
