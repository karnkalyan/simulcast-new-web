import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const MCP_SECRET_STR = process.env.MCP_JWT_SECRET || process.env.AUTH_SECRET || "simulcast_mcp_jwt_secret_secure_key_2026_x92817491823";
const MCP_SECRET = new TextEncoder().encode(MCP_SECRET_STR);

export interface McpTokenPayload {
  sub: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Creates an encrypted JWT API token for MCP integration
 */
export async function createMcpToken(payload: { name: string; role?: string; expiresIn?: string }): Promise<string> {
  return new SignJWT({
    name: payload.name,
    role: payload.role || "MCP_CLIENT",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.name)
    .setIssuedAt()
    .setExpirationTime(payload.expiresIn || "30d")
    .sign(MCP_SECRET);
}

/**
 * Verifies an incoming MCP API request by checking:
 * 1. Bearer JWT token against secret, OR
 * 2. Raw API key against database ApiToken or MASTER MCP key, OR
 * 3. x-mcp-key header
 */
export async function verifyMcpAuth(req: Request): Promise<{ authenticated: boolean; identity?: string; role?: string; error?: string }> {
  const authHeader = req.headers.get("authorization") || "";
  const customKey = req.headers.get("x-mcp-key") || req.headers.get("x-api-key");
  const masterKey = process.env.MCP_API_KEY || "simulcast_master_mcp_api_key_2026_sec";

  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (customKey) {
    token = customKey.trim();
  }

  if (!token) {
    return { authenticated: false, error: "Missing authorization token. Provide 'Authorization: Bearer <token>' or 'x-mcp-key'." };
  }

  // 1. Direct match with Master Key or ADMIN_KEY
  const adminKey = process.env.ADMIN_KEY;
  if (token === masterKey || (adminKey && token === adminKey)) {
    return { authenticated: true, identity: "Master Administrator", role: "MCP_ADMIN" };
  }

  // 2. Database ApiToken match
  try {
    const dbToken = await prisma.apiToken.findUnique({
      where: { token },
    });
    if (dbToken && !dbToken.revoked) {
      await prisma.apiToken.update({
        where: { id: dbToken.id },
        data: { lastUsedAt: new Date() },
      });
      return { authenticated: true, identity: dbToken.name, role: dbToken.role };
    }
  } catch (err) {
    console.error("[MCP DB Auth Error]", err);
  }

  // 3. JWT Verification
  try {
    const { payload } = await jwtVerify(token, MCP_SECRET, { algorithms: ["HS256"] });
    return {
      authenticated: true,
      identity: (payload.name as string) || (payload.sub as string) || "JWT Client",
      role: (payload.role as string) || "MCP_CLIENT",
    };
  } catch {
    // JWT verification failed
  }

  return { authenticated: false, error: "Invalid or revoked MCP authentication token." };
}
