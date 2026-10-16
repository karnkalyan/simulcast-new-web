import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setMcpConnectionStatus } from "@/lib/mcp-manager";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();
    if (!id || (status !== "CONNECTED" && status !== "DISCONNECTED")) {
      return NextResponse.json({ error: "Valid id and status ('CONNECTED' | 'DISCONNECTED') are required." }, { status: 400 });
    }

    const result = await setMcpConnectionStatus(id, status);
    if (!result.ok) {
      return NextResponse.json({ error: "Connection not found or failed to update." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, connection: result.connection });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update connection status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
