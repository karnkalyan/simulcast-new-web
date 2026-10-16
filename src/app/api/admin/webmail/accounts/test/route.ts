import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { testMailAccountConnection } from "@/lib/webmail";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const result = await testMailAccountConnection(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
