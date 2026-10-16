import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMcpConnections, registerMcpConnection, deleteMcpConnection } from "@/lib/mcp-manager";
import { createMcpToken } from "@/lib/mcp-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getMcpConnections();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load MCP connections";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientName, role = "MCP_CLIENT", scopes = "all", expiresIn = "90d" } = body;

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    const token = await createMcpToken({
      name: clientName.trim(),
      role,
      expiresIn,
    });

    // registerMcpConnection was already invoked inside createMcpToken, so we retrieve the newly created connection
    const { connections } = await getMcpConnections();
    const conn = connections.find((c) => c.clientName.toLowerCase() === clientName.trim().toLowerCase()) || {
      id: "mconn_new",
      clientName: clientName.trim(),
      role,
      scopes,
      status: "CONNECTED" as const,
      token,
      tokenPrefix: `${token.slice(0, 18)}...`,
      requestCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      ok: true,
      token,
      connection: conn,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to authorize client";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await deleteMcpConnection(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete connection";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
