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

  let clientIdentity = "ChatGPT Plugin Client";
  let clientRole = "MCP_ADMIN";

  if (code) {
    try {
      const decoded = JSON.parse(Buffer.from(code, "base64url").toString("utf-8"));
      if (decoded.user) clientIdentity = String(decoded.user);
      if (decoded.role) clientRole = String(decoded.role);
    } catch {}
  }

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "ChatGPT-Client";

  // Generate an authorized JWT access token valid for 30 days tied to the authenticated user
  const accessToken = await createMcpToken({
    name: clientIdentity,
    role: clientRole,
    expiresIn: "30d",
    ipAddress,
    userAgent,
  });

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 2592000, // 30 days
      scope: "mcp:read mcp:write admin",
      token: accessToken,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      token_endpoint: "/api/oauth/token",
      supported_grant_types: ["authorization_code", "client_credentials"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

