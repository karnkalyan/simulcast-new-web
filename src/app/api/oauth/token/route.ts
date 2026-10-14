import { NextResponse } from "next/server";
import { createMcpToken } from "@/lib/mcp-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let grantType = "authorization_code";
  let code = "";

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    grantType = String(formData.get("grant_type") || "authorization_code");
    code = String(formData.get("code") || "");
  } else if (contentType.includes("application/json")) {
    const json = await request.json().catch(() => ({}));
    grantType = json.grant_type || "authorization_code";
    code = json.code || "";
  }

  // Generate an authorized JWT access token valid for 30 days
  const accessToken = await createMcpToken({
    name: "ChatGPT OAuth Client",
    role: "MCP_ADMIN",
    expiresIn: "30d",
  });

  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 2592000, // 30 days
    scope: "mcp:read mcp:write admin",
    token: accessToken,
  });
}

export async function GET() {
  return NextResponse.json({
    token_endpoint: "/api/oauth/token",
    supported_grant_types: ["authorization_code", "client_credentials"],
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

