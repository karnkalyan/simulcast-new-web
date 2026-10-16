import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getWebmailMessages,
  sendWebmailMessage,
  saveWebmailDraft,
  updateMessageFlags,
  deleteWebmailMessage,
} from "@/lib/webmail";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const accountId = searchParams.get("accountId") || undefined;
    const accountEmail = searchParams.get("accountEmail") || undefined;
    const folder = (searchParams.get("folder") || "INBOX") as any;
    const filter = (searchParams.get("filter") || "ALL") as any;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;

    const data = await getWebmailMessages({
      accountId,
      accountEmail,
      folder,
      filter,
      search,
      limit,
      page,
    });

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    if (body.action === "draft") {
      const draft = await saveWebmailDraft(body);
      return NextResponse.json({ success: true, draft });
    }

    // Default action: send
    if (!body.to || !body.subject || !body.bodyHtml) {
      return NextResponse.json(
        { error: "Recipient ('to'), Subject, and Message body are required to send an email." },
        { status: 400 }
      );
    }

    const result = await sendWebmailMessage({
      fromAccount: body.fromAccount,
      accountId: body.accountId,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText,
      attachments: body.attachments,
      draftId: body.draftId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, isRead, isStarred, folder } = body;

    if (!id) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }

    const updated = await updateMessageFlags(id, { isRead, isStarred, folder });
    return NextResponse.json({ success: true, message: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }

    const res = await deleteWebmailMessage(id, permanent);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
