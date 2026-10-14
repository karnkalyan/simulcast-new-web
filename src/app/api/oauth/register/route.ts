import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * RFC 7591 Dynamic Client Registration endpoint for ChatGPT / Apps SDK
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const clientName = String(body.client_name || "ChatGPT Client");
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
  const clientId = `simulcast_chatgpt_${crypto.randomBytes(8).toString("hex")}`;
  const clientSecret = process.env.MCP_API_KEY || "simulcast_master_mcp_api_key_2026_sec";

  return NextResponse.json(
    {
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0, // Never expires
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "client_credentials"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
      scope: "mcp:read mcp:write admin",
    },
    {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
