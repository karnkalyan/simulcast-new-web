import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";

  // Encode an authorization code embedding the client state and timestamp
  const codePayload = Buffer.from(
    JSON.stringify({
      issuedAt: Date.now(),
      state,
      codeChallenge,
      scope: "mcp:read mcp:write admin",
    })
  ).toString("base64url");

  // Redirect back to client callback with code and state (auto-approves ChatGPT client)
  if (redirectUri) {
    const target = new URL(redirectUri);
    target.searchParams.set("code", codePayload);
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target.toString(), 302);
  }

  return NextResponse.json({
    status: "authorized",
    code: codePayload,
    state,
    instructions: "Pass this code to /api/oauth/token to receive an access token.",
  });
}
