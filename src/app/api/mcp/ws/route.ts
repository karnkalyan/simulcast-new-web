import { NextResponse } from "next/server";
import { verifyMcpAuth, createMcpToken } from "@/lib/mcp-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyMcpAuth(request);
  const host = request.headers.get("host") || "localhost:3000";
  const isSecure = request.headers.get("x-forwarded-proto") === "https";
  const wsProtocol = isSecure ? "wss" : "ws";
  const wsUrl = `${wsProtocol}://${host}/api/ws`;

  return NextResponse.json({
    status: "active",
    protocol: "mcp-websocket",
    wsUrl,
    authenticated: auth.authenticated,
    identity: auth.identity || null,
    instructions: {
      connect: `Connect to ${wsUrl}?token=<API_TOKEN>`,
      authMethod: 'Send {"jsonrpc":"2.0","method":"auth","params":{"token":"<API_TOKEN>"},"id":1}',
      supportedMethods: ["initialize", "tools/list", "tools/call", "ping"],
    },
  });
}

export async function POST(request: Request) {
  const auth = await verifyMcpAuth(request);
  if (!auth.authenticated || auth.role !== "MCP_ADMIN") {
    return NextResponse.json({ error: "Only MCP_ADMIN can generate encrypted JWT tokens." }, { status: 403 });
  }

  try {
    const { name = "External MCP Client", expiresIn = "30d" } = await request.json();
    const token = await createMcpToken({ name, expiresIn });
    return NextResponse.json({ ok: true, name, token, expiresIn });
  } catch (error) {
    console.error("[MCP Token Generation error]", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
