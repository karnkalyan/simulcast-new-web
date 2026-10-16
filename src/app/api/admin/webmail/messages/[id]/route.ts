import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getWebmailMessage, updateMessageFlags, deleteWebmailMessage } from "@/lib/webmail";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const msg = await getWebmailMessage(id);
    if (!msg) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    return NextResponse.json({ message: msg });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const updated = await updateMessageFlags(id, body);
    return NextResponse.json({ success: true, message: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";
    const res = await deleteWebmailMessage(id, permanent);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
