import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getEmailLogs } from "@/lib/email-queue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const logs = await getEmailLogs({ status, search, limit });
  return NextResponse.json({ logs });
}
