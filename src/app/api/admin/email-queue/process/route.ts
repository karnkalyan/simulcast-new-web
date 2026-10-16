import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email-queue";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let batchSize = 25;
    try {
      const body = await request.json();
      if (typeof body.batchSize === "number") {
        batchSize = Math.min(Math.max(1, body.batchSize), 100);
      }
    } catch {}

    const result = await processEmailQueue(batchSize);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Process failed: ${msg}` }, { status: 500 });
  }
}
