import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const issuer = SITE_URL;
  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    userinfo_endpoint: `${issuer}/api/oauth/userinfo`,
    jwks_uri: `${issuer}/api/oauth/jwks`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "client_credentials"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    code_challenge_methods_supported: ["S256", "plain"],
    scopes_supported: ["mcp:read", "mcp:write", "admin"],
  });
}
