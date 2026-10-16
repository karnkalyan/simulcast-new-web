import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMcpConnectionLogs } from "@/lib/mcp-manager";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const event = searchParams.get("event") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const logs = await getMcpConnectionLogs({ limit, event, search });
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load connection logs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
