import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { recordMcpActivity, registerMcpConnection } from "@/lib/mcp-manager";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

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
 * Creates an encrypted JWT API token for MCP integration and registers connected client
 */
export async function createMcpToken(payload: {
  name: string;
  role?: string;
  expiresIn?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string> {
  const token = await new SignJWT({
    name: payload.name,
    role: payload.role || "MCP_CLIENT",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.name)
    .setIssuedAt()
    .setExpirationTime(payload.expiresIn || "30d")
    .sign(MCP_SECRET);

  try {
    await registerMcpConnection({
      clientName: payload.name,
      token,
      role: payload.role || "MCP_CLIENT",
      scopes: "all",
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });
  } catch (err) {
    console.error("[MCP Register Connection Error]", err);
  }

  return token;
}

/**
 * Verifies an incoming MCP API request by checking:
 * 1. Admin/Connected Disconnect status (blocks if disconnected from admin panel)
 * 2. Bearer JWT token against secret, OR
 * 3. Raw API key against database ApiToken or MASTER MCP key, OR
 * 4. x-mcp-key header
 */
export async function verifyMcpAuth(
  req: Request,
  toolName?: string
): Promise<{
  authenticated: boolean;
  identity?: string;
  role?: string;
  connectionId?: string;
  error?: string;
}> {
  const authHeader = req.headers.get("authorization") || "";
  const customKey = req.headers.get("x-mcp-key") || req.headers.get("x-api-key");
  const masterKey = process.env.MCP_API_KEY || "simulcast_master_mcp_api_key_2026_sec";
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "MCP-Client";

  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (customKey) {
    token = customKey.trim();
  }

  if (!token) {
    return {
      authenticated: false,
      error: "Missing authorization token. Provide 'Authorization: Bearer <token>' or 'x-mcp-key'.",
    };
  }

  // Check connected client status & disconnect blocks
  const activity = await recordMcpActivity({
    tokenOrIdentity: token,
    toolName,
    ipAddress,
    userAgent,
  });

  if (activity.authorized === false) {
    return {
      authenticated: false,
      error: "Connection has been disconnected or revoked from the Admin Panel.",
    };
  }

  if (activity.connection) {
    return {
      authenticated: true,
      identity: activity.connection.clientName,
      role: activity.connection.role,
      connectionId: activity.connection.id,
    };
  }

  // 1. Direct match with Master Key or ADMIN_KEY
  const adminKey = process.env.ADMIN_KEY;
  if (token === masterKey || (adminKey && token === adminKey)) {
    await recordMcpActivity({
      tokenOrIdentity: "Master Administrator",
      toolName,
      ipAddress,
      userAgent,
    });
    return { authenticated: true, identity: "Master Administrator", role: "MCP_ADMIN" };
  }

  // 2. Database ApiToken match
  try {
    const dbToken = await db.apiToken.findUnique({
      where: { token },
    });
    if (dbToken && !dbToken.revoked) {
      await db.apiToken.update({
        where: { id: dbToken.id },
        data: { lastUsedAt: new Date() },
      });
      return { authenticated: true, identity: dbToken.name, role: dbToken.role };
    }
    if (dbToken && dbToken.revoked) {
      return { authenticated: false, error: "API token has been revoked." };
    }
  } catch (err) {
    console.error("[MCP DB Auth Error]", err);
  }

  // 3. JWT Verification
  try {
    const { payload } = await jwtVerify(token, MCP_SECRET, { algorithms: ["HS256"] });
    const identity = (payload.name as string) || (payload.sub as string) || "JWT Client";
    const role = (payload.role as string) || "MCP_CLIENT";

    // Auto-track activity under verified JWT identity
    await recordMcpActivity({
      tokenOrIdentity: identity,
      toolName,
      ipAddress,
      userAgent,
    });

    return {
      authenticated: true,
      identity,
      role,
    };
  } catch {
    // JWT verification failed
  }

  return { authenticated: false, error: "Invalid or revoked MCP authentication token." };
}
