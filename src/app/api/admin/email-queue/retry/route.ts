import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { retryFailedEmails } from "@/lib/email-queue";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let id: string | undefined;
    try {
      const body = await request.json();
      if (typeof body.id === "string") id = body.id;
    } catch {}

    const result = await retryFailedEmails(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Retry failed: ${msg}` }, { status: 500 });
  }
}
