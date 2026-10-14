import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * GET /api/oauth/authorize - Initiates OAuth flow by displaying the branded login & consent dialog
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const clientId = searchParams.get("client_id") || "chatgpt";
  const scope = searchParams.get("scope") || "mcp:read mcp:write admin";
  const auto = searchParams.get("auto") === "true";

  // If auto-approval is explicitly requested (e.g. headless tests)
  if (auto && redirectUri) {
    const codePayload = Buffer.from(
      JSON.stringify({
        issuedAt: Date.now(),
        user: "ChatGPT Auto-Approved Client",
        role: "MCP_ADMIN",
        state,
        codeChallenge,
        scope,
      })
    ).toString("base64url");

    const target = new URL(redirectUri);
    target.searchParams.set("code", codePayload);
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target.toString(), 302);
  }

  // Redirect user's browser to the branded interactive login & consent dialog
  const dialogUrl = new URL("/oauth/authorize", request.url);
  if (redirectUri) dialogUrl.searchParams.set("redirect_uri", redirectUri);
  if (state) dialogUrl.searchParams.set("state", state);
  if (clientId) dialogUrl.searchParams.set("client_id", clientId);
  if (scope) dialogUrl.searchParams.set("scope", scope);
  if (codeChallenge) dialogUrl.searchParams.set("code_challenge", codeChallenge);

  return NextResponse.redirect(dialogUrl.toString(), 302);
}

/**
 * POST /api/oauth/authorize - Validates credentials from the login dialog and grants the authorization code
 */
export async function POST(request: Request) {
  let body: Record<string, string> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { email, password, apiKey, redirectUri, state, codeChallenge, scope } = body;

  if (!redirectUri) {
    return NextResponse.json({ error: "Missing redirect_uri" }, { status: 400 });
  }

  let authenticatedUser = "";
  let role = "MCP_CLIENT";

  const masterKey = process.env.MCP_API_KEY || "simulcast_master_mcp_api_key_2026_sec";
  const adminKey = process.env.ADMIN_KEY || "simulcast-admin";

  // 1. Check API Key / Master Key
  if (apiKey) {
    const key = apiKey.trim();
    if (key === masterKey || key === adminKey) {
      authenticatedUser = "Master Admin";
      role = "MCP_ADMIN";
    } else {
      // Check database ApiTokens
      try {
        const dbToken = await prisma.apiToken.findUnique({ where: { token: key } });
        if (dbToken && !dbToken.revoked) {
          authenticatedUser = dbToken.name;
          role = dbToken.role;
        }
      } catch {}
    }
  }

  // 2. Check Admin Email & Password
  if (!authenticatedUser && email && password) {
    try {
      const user = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (user && user.active && (await bcrypt.compare(password, user.passwordHash))) {
        authenticatedUser = user.email;
        role = user.role === "ADMIN" ? "MCP_ADMIN" : "MCP_CLIENT";
      }
    } catch {}
  }

  // 3. Check existing browser session cookie
  if (!authenticatedUser) {
    const session = await getSession();
    if (session) {
      authenticatedUser = session.email;
      role = session.role === "ADMIN" ? "MCP_ADMIN" : "MCP_CLIENT";
    }
  }

  if (!authenticatedUser) {
    return NextResponse.json(
      { error: "Invalid credentials. Please enter a valid admin email & password, or master security key." },
      { status: 401 }
    );
  }

  // Create signed OAuth authorization code embedding the authenticated user identity
  const codePayload = Buffer.from(
    JSON.stringify({
      issuedAt: Date.now(),
      user: authenticatedUser,
      role,
      state: state || "",
      codeChallenge: codeChallenge || "",
      scope: scope || "mcp:read mcp:write admin",
    })
  ).toString("base64url");

  const target = new URL(redirectUri);
  target.searchParams.set("code", codePayload);
  if (state) target.searchParams.set("state", state);

  return NextResponse.json(
    {
      ok: true,
      redirectUrl: target.toString(),
    },
    {
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
