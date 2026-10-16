import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncMailbox } from "@/lib/webmail";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const res = await syncMailbox(body.accountEmail);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
