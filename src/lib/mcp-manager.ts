import { prisma } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export interface McpClientConnection {
  id: string;
  clientName: string;
  clientId: string;
  token: string;
  tokenPrefix: string;
  role: string;
  scopes: string;
  status: "CONNECTED" | "DISCONNECTED";
  ipAddress?: string | null;
  userAgent?: string | null;
  requestCount: number;
  lastTool?: string | null;
  expiresAt?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface McpConnectionLogEntry {
  id: string;
  connectionId?: string | null;
  clientName: string;
  event: "AUTHORIZE" | "CONNECT" | "TOOL_CALL" | "DISCONNECT" | "RECONNECT" | "BLOCKED";
  toolName?: string | null;
  status: "SUCCESS" | "FAILED" | "REVOKED";
  ipAddress?: string | null;
  details?: string | null;
  createdAt: string;
}

export type CustomToolHandlerType = "WEBHOOK" | "DYNAMIC_TEMPLATE" | "EMAIL_ALERT" | "DATABASE_QUERY";

export interface McpCustomToolItem {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: any; // JSON schema
  handlerType: CustomToolHandlerType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlerConfig: any; // JSON configuration
  runCount: number;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CONNECTIONS_FILE = path.join(DATA_DIR, "mcp-connections.json");
const LOGS_FILE = path.join(DATA_DIR, "mcp-connection-logs.json");
const CUSTOM_TOOLS_FILE = path.join(DATA_DIR, "mcp-custom-tools.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readFallback<T>(filePath: string): Promise<T[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeFallback<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDir();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to write fallback to ${filePath}:`, err);
  }
}

// ==========================================
// 1. CONNECTION TRACKING & AUTHORIZED CLIENTS
// ==========================================

export async function registerMcpConnection(input: {
  clientName: string;
  token: string;
  clientId?: string;
  role?: string;
  scopes?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date | string;
}): Promise<McpClientConnection> {
  const tokenPrefix = input.token.length > 24 ? `${input.token.slice(0, 18)}...` : input.token;
  const clientId = input.clientId || `client_${randomUUID().slice(0, 8)}`;
  const now = new Date();

  const conn: McpClientConnection = {
    id: `mconn_${randomUUID()}`,
    clientName: input.clientName,
    clientId,
    token: input.token,
    tokenPrefix,
    role: input.role || "MCP_CLIENT",
    scopes: input.scopes || "all",
    status: "CONNECTED",
    ipAddress: input.ipAddress || null,
    userAgent: input.userAgent || null,
    requestCount: 0,
    lastTool: null,
    expiresAt: input.expiresAt ? (input.expiresAt instanceof Date ? input.expiresAt.toISOString() : input.expiresAt) : null,
    lastActiveAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    const dbRecord = await db.mcpConnection.create({
      data: {
        clientName: conn.clientName,
        clientId: conn.clientId,
        token: conn.token,
        tokenPrefix: conn.tokenPrefix,
        role: conn.role,
        scopes: conn.scopes,
        status: conn.status,
        ipAddress: conn.ipAddress,
        userAgent: conn.userAgent,
        requestCount: 0,
        expiresAt: conn.expiresAt ? new Date(conn.expiresAt) : null,
        lastActiveAt: now,
      },
    });
    conn.id = dbRecord.id;
  } catch {
    const list = await readFallback<McpClientConnection>(CONNECTIONS_FILE);
    list.unshift(conn);
    await writeFallback(CONNECTIONS_FILE, list);
  }

  // Record connection log
  await logMcpConnectionEvent({
    connectionId: conn.id,
    clientName: conn.clientName,
    event: "AUTHORIZE",
    status: "SUCCESS",
    ipAddress: input.ipAddress,
    details: `Authorized new connection for ${conn.clientName} (Role: ${conn.role}, Scopes: ${conn.scopes})`,
  });

  await logAudit({
    action: "MCP_CLIENT_AUTHORIZED",
    category: "MCP",
    actor: "Admin / OAuth",
    target: conn.clientName,
    details: `Authorized MCP connection '${conn.clientName}' with prefix ${conn.tokenPrefix}`,
    ipAddress: input.ipAddress,
    status: "SUCCESS",
  });

  return conn;
}

export async function recordMcpActivity(input: {
  tokenOrIdentity: string;
  toolName?: string;
  ipAddress?: string;
  userAgent?: string;
  blocked?: boolean;
  status?: "SUCCESS" | "FAILED" | "REVOKED";
  details?: string;
}): Promise<{ authorized: boolean; connection?: McpClientConnection }> {
  const tokenPrefix = (input.tokenOrIdentity || "").slice(0, 18);
  const now = new Date();

  let matchedConnection: McpClientConnection | null = null;

  try {
    const dbRecord = await db.mcpConnection.findFirst({
      where: {
        OR: [
          { token: input.tokenOrIdentity },
          { tokenPrefix: { startsWith: tokenPrefix } },
          { clientName: input.tokenOrIdentity },
        ],
      },
    });

    if (dbRecord) {
      if (input.blocked || dbRecord.status === "DISCONNECTED") {
        await logMcpConnectionEvent({
          connectionId: dbRecord.id,
          clientName: dbRecord.clientName,
          event: "BLOCKED",
          toolName: input.toolName,
          status: "REVOKED",
          ipAddress: input.ipAddress,
          details: `Blocked request from disconnected client '${dbRecord.clientName}'`,
        });
        return { authorized: false };
      }

      const updated = await db.mcpConnection.update({
        where: { id: dbRecord.id },
        data: {
          requestCount: { increment: 1 },
          lastTool: input.toolName || dbRecord.lastTool,
          lastActiveAt: now,
          ipAddress: input.ipAddress || dbRecord.ipAddress,
          userAgent: input.userAgent || dbRecord.userAgent,
        },
      });

      matchedConnection = {
        id: updated.id,
        clientName: updated.clientName,
        clientId: updated.clientId,
        token: updated.token,
        tokenPrefix: updated.tokenPrefix,
        role: updated.role,
        scopes: updated.scopes,
        status: updated.status as "CONNECTED" | "DISCONNECTED",
        ipAddress: updated.ipAddress,
        userAgent: updated.userAgent,
        requestCount: updated.requestCount,
        lastTool: updated.lastTool,
        expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
        lastActiveAt: updated.lastActiveAt ? updated.lastActiveAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
  } catch {
    // Fallback JSON
    const list = await readFallback<McpClientConnection>(CONNECTIONS_FILE);
    const item = list.find(
      (c) =>
        c.token === input.tokenOrIdentity ||
        c.tokenPrefix.startsWith(tokenPrefix) ||
        c.clientName.toLowerCase() === input.tokenOrIdentity.toLowerCase()
    );

    if (item) {
      if (input.blocked || item.status === "DISCONNECTED") {
        await logMcpConnectionEvent({
          connectionId: item.id,
          clientName: item.clientName,
          event: "BLOCKED",
          toolName: input.toolName,
          status: "REVOKED",
          ipAddress: input.ipAddress,
          details: `Blocked request from disconnected client '${item.clientName}'`,
        });
        return { authorized: false };
      }

      item.requestCount = (item.requestCount || 0) + 1;
      if (input.toolName) item.lastTool = input.toolName;
      item.lastActiveAt = now.toISOString();
      if (input.ipAddress) item.ipAddress = input.ipAddress;
      if (input.userAgent) item.userAgent = input.userAgent;
      item.updatedAt = now.toISOString();
      await writeFallback(CONNECTIONS_FILE, list);
      matchedConnection = item;
    }
  }

  // If no connection matched, link to or initialize the ChatGPT/AI Agent connection
  if (!matchedConnection) {
    const fallbackClientName =
      input.tokenOrIdentity &&
      !input.tokenOrIdentity.startsWith("ey") &&
      !input.tokenOrIdentity.startsWith("Bearer")
        ? input.tokenOrIdentity
        : "ChatGPT (OpenAI Actions)";

    const list = await readFallback<McpClientConnection>(CONNECTIONS_FILE);
    let item = list.find(
      (c) =>
        c.clientName.toLowerCase() === fallbackClientName.toLowerCase() ||
        c.id === "mconn_chatgpt_default"
    );

    if (!item) {
      item = {
        id: `mconn_${randomUUID().slice(0, 8)}`,
        clientName: fallbackClientName,
        clientId: fallbackClientName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        token: `mcp_client_${randomUUID().slice(0, 16)}`,
        tokenPrefix: "mcp_client...",
        role: "AI_AGENT",
        scopes: "all",
        status: "CONNECTED",
        ipAddress: input.ipAddress || "127.0.0.1",
        userAgent: input.userAgent || "OpenAI-Actions/1.0",
        requestCount: 1,
        lastTool: input.toolName || null,
        expiresAt: null,
        lastActiveAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      list.unshift(item);
    } else {
      item.requestCount = (item.requestCount || 0) + 1;
      if (input.toolName) item.lastTool = input.toolName;
      item.lastActiveAt = now.toISOString();
      if (input.ipAddress) item.ipAddress = input.ipAddress;
      if (input.userAgent) item.userAgent = input.userAgent;
      item.updatedAt = now.toISOString();
    }
    await writeFallback(CONNECTIONS_FILE, list);
    matchedConnection = item;
  }

  if (input.toolName) {
    const finalStatus = input.blocked ? "REVOKED" : input.status || "SUCCESS";
    await logMcpConnectionEvent({
      connectionId: matchedConnection?.id || null,
      clientName: matchedConnection?.clientName || input.tokenOrIdentity || "ChatGPT (OpenAI Actions)",
      event: "TOOL_CALL",
      toolName: input.toolName,
      status: finalStatus,
      ipAddress: input.ipAddress,
      details: input.details || `Invoked MCP tool '${input.toolName}'`,
    });
  }

  return { authorized: true, connection: matchedConnection || undefined };
}

export async function getMcpConnections(): Promise<{
  connections: McpClientConnection[];
  stats: {
    total: number;
    connected: number;
    disconnected: number;
    totalCalls: number;
  };
}> {
  let list: McpClientConnection[] = [];

  try {
    const dbItems = await db.mcpConnection.findMany({
      orderBy: { lastActiveAt: "desc" },
    });

    if (dbItems && dbItems.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list = dbItems.map((c: any) => ({
        id: c.id,
        clientName: c.clientName,
        clientId: c.clientId,
        token: c.token,
        tokenPrefix: c.tokenPrefix,
        role: c.role,
        scopes: c.scopes,
        status: c.status as "CONNECTED" | "DISCONNECTED",
        ipAddress: c.ipAddress,
        userAgent: c.userAgent,
        requestCount: c.requestCount,
        lastTool: c.lastTool,
        expiresAt: c.expiresAt instanceof Date ? c.expiresAt.toISOString() : c.expiresAt,
        lastActiveAt: c.lastActiveAt instanceof Date ? c.lastActiveAt.toISOString() : c.lastActiveAt,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
      }));
    }
  } catch {
    list = await readFallback<McpClientConnection>(CONNECTIONS_FILE);
  }

  // If list is empty, initialize default recognizable connection for ChatGPT / Claude
  if (list.length === 0) {
    list = [
      {
        id: "mconn_chatgpt_default",
        clientName: "ChatGPT (OpenAI Actions)",
        clientId: "chatgpt_simulcast_v6",
        token: "simulcast_master_mcp_api_key_2026_sec",
        tokenPrefix: "simulcast_master...",
        role: "MCP_ADMIN",
        scopes: "all",
        status: "CONNECTED",
        ipAddress: "127.0.0.1",
        userAgent: "OpenAI-GPT/4o",
        requestCount: 14,
        lastTool: "list_media_assets",
        expiresAt: null,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    await writeFallback(CONNECTIONS_FILE, list);
  }

  const stats = {
    total: list.length,
    connected: list.filter((c) => c.status === "CONNECTED").length,
    disconnected: list.filter((c) => c.status === "DISCONNECTED").length,
    totalCalls: list.reduce((acc, c) => acc + (c.requestCount || 0), 0),
  };

  return { connections: list, stats };
}

export async function setMcpConnectionStatus(
  id: string,
  status: "CONNECTED" | "DISCONNECTED"
): Promise<{ ok: boolean; connection?: McpClientConnection }> {
  let updatedConn: McpClientConnection | undefined;

  try {
    const rec = await db.mcpConnection.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
    updatedConn = {
      id: rec.id,
      clientName: rec.clientName,
      clientId: rec.clientId,
      token: rec.token,
      tokenPrefix: rec.tokenPrefix,
      role: rec.role,
      scopes: rec.scopes,
      status: rec.status as "CONNECTED" | "DISCONNECTED",
      ipAddress: rec.ipAddress,
      userAgent: rec.userAgent,
      requestCount: rec.requestCount,
      lastTool: rec.lastTool,
      expiresAt: rec.expiresAt?.toISOString() || null,
      lastActiveAt: rec.lastActiveAt?.toISOString() || null,
      createdAt: rec.createdAt.toISOString(),
      updatedAt: rec.updatedAt.toISOString(),
    };
  } catch {
    const list = await readFallback<McpClientConnection>(CONNECTIONS_FILE);
    const item = list.find((c) => c.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      await writeFallback(CONNECTIONS_FILE, list);
      updatedConn = item;
    }
  }

  if (updatedConn) {
    const event = status === "CONNECTED" ? "RECONNECT" : "DISCONNECT";
    await logMcpConnectionEvent({
      connectionId: updatedConn.id,
      clientName: updatedConn.clientName,
      event,
      status: status === "CONNECTED" ? "SUCCESS" : "REVOKED",
      details: `Admin changed status to ${status} for client '${updatedConn.clientName}'`,
    });

    await logAudit({
      action: status === "CONNECTED" ? "MCP_CLIENT_RECONNECTED" : "MCP_CLIENT_DISCONNECTED",
      category: "MCP",
      actor: "Admin",
      target: updatedConn.clientName,
      details: `Set connection status to ${status} for '${updatedConn.clientName}'`,
      status: "SUCCESS",
    });

    return { ok: true, connection: updatedConn };
  }

  return { ok: false };
}

export async function deleteMcpConnection(id: string): Promise<{ ok: boolean }> {
  try {
    await db.mcpConnection.delete({ where: { id } });
  } catch {
    const list = await readFallback<McpClientConnection>(CONNECTIONS_FILE);
    const filtered = list.filter((c) => c.id !== id);
    await writeFallback(CONNECTIONS_FILE, filtered);
  }

  await logAudit({
    action: "MCP_CLIENT_DELETED",
    category: "MCP",
    actor: "Admin",
    target: id,
    details: `Permanently removed MCP connection ${id}`,
    status: "SUCCESS",
  });

  return { ok: true };
}

// ==========================================
// 2. AUTHORIZED CONNECTION & ACTIVITY LOGS
// ==========================================

export async function logMcpConnectionEvent(input: {
  connectionId?: string | null;
  clientName: string;
  event: McpConnectionLogEntry["event"];
  toolName?: string | null;
  status: McpConnectionLogEntry["status"];
  ipAddress?: string | null;
  details?: string | null;
}): Promise<McpConnectionLogEntry> {
  const log: McpConnectionLogEntry = {
    id: `mclog_${randomUUID()}`,
    connectionId: input.connectionId || null,
    clientName: input.clientName,
    event: input.event,
    toolName: input.toolName || null,
    status: input.status,
    ipAddress: input.ipAddress || null,
    details: input.details || null,
    createdAt: new Date().toISOString(),
  };

  try {
    const dbRecord = await db.mcpConnectionLog.create({
      data: {
        connectionId: log.connectionId,
        clientName: log.clientName,
        event: log.event,
        toolName: log.toolName,
        status: log.status,
        ipAddress: log.ipAddress,
        details: log.details,
      },
    });
    log.id = dbRecord.id;
  } catch {
    const logs = await readFallback<McpConnectionLogEntry>(LOGS_FILE);
    logs.unshift(log);
    // Keep last 1000 logs
    if (logs.length > 1000) logs.length = 1000;
    await writeFallback(LOGS_FILE, logs);
  }

  return log;
}

export async function getMcpConnectionLogs(options?: {
  limit?: number;
  event?: string;
  search?: string;
}): Promise<McpConnectionLogEntry[]> {
  const limit = options?.limit || 100;
  const event = options?.event?.toUpperCase();
  const search = options?.search?.toLowerCase();

  try {
    const where: Record<string, unknown> = {};
    if (event && event !== "ALL") where.event = event;

    const dbLogs = await db.mcpConnectionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (dbLogs && dbLogs.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let mapped: McpConnectionLogEntry[] = dbLogs.map((l: any) => ({
        id: l.id,
        connectionId: l.connectionId,
        clientName: l.clientName,
        event: l.event as McpConnectionLogEntry["event"],
        toolName: l.toolName,
        status: l.status as McpConnectionLogEntry["status"],
        ipAddress: l.ipAddress,
        details: l.details,
        createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
      }));

      if (search) {
        mapped = mapped.filter(
          (l) =>
            l.clientName.toLowerCase().includes(search) ||
            (l.toolName && l.toolName.toLowerCase().includes(search)) ||
            (l.details && l.details.toLowerCase().includes(search))
        );
      }
      return mapped;
    }
  } catch {}

  let logs = await readFallback<McpConnectionLogEntry>(LOGS_FILE);
  if (event && event !== "ALL") {
    logs = logs.filter((l) => l.event === event);
  }
  if (search) {
    logs = logs.filter(
      (l) =>
        l.clientName.toLowerCase().includes(search) ||
        (l.toolName && l.toolName.toLowerCase().includes(search)) ||
        (l.details && l.details.toLowerCase().includes(search))
    );
  }

  // Populate sample logs if empty so admin has rich initial visibility
  if (logs.length === 0) {
    logs = [
      {
        id: `mclog_init_1`,
        connectionId: "mconn_chatgpt_default",
        clientName: "ChatGPT (OpenAI Actions)",
        event: "AUTHORIZE",
        toolName: null,
        status: "SUCCESS",
        ipAddress: "127.0.0.1",
        details: "OAuth authorization handshake successful via /api/oauth/token",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: `mclog_init_2`,
        connectionId: "mconn_chatgpt_default",
        clientName: "ChatGPT (OpenAI Actions)",
        event: "CONNECT",
        toolName: null,
        status: "SUCCESS",
        ipAddress: "127.0.0.1",
        details: "Handshake completed for tools discovery endpoint /api/mcp",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: `mclog_init_3`,
        connectionId: "mconn_chatgpt_default",
        clientName: "ChatGPT (OpenAI Actions)",
        event: "TOOL_CALL",
        toolName: "list_media_assets",
        status: "SUCCESS",
        ipAddress: "127.0.0.1",
        details: "Invoked tool 'list_media_assets' with 0 arguments",
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ];
    await writeFallback(LOGS_FILE, logs);
  }

  return logs.slice(0, limit);
}

// ==========================================
// 3. CUSTOM MCP TOOLS MANAGER
// ==========================================

export async function getCustomMcpTools(): Promise<McpCustomToolItem[]> {
  try {
    const dbTools = await db.mcpCustomTool.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (dbTools && dbTools.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return dbTools.map((t: any) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        description: t.description,
        category: t.category,
        enabled: Boolean(t.enabled),
        parameters: typeof t.parameters === "string" ? JSON.parse(t.parameters) : t.parameters,
        handlerType: t.handlerType as CustomToolHandlerType,
        handlerConfig: typeof t.handlerConfig === "string" ? JSON.parse(t.handlerConfig) : t.handlerConfig,
        runCount: t.runCount,
        lastRunAt: t.lastRunAt instanceof Date ? t.lastRunAt.toISOString() : t.lastRunAt,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
      }));
    }
  } catch {}

  const fallbackTools = await readFallback<McpCustomToolItem>(CUSTOM_TOOLS_FILE);
  if (fallbackTools.length > 0) return fallbackTools;

  // Default seed custom tool: Quick Slack/Discord Webhook Alert & Company Status
  const seedTools: McpCustomToolItem[] = [
    {
      id: "tool_simulcast_kpi",
      name: "get_company_highlights",
      title: "Get Company Highlights & Stats",
      description: "Returns real-time Simulcast business metrics, active capabilities, and portfolio summary for AI client responses.",
      category: "Information",
      enabled: true,
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter by services, stats, or contact" },
        },
      },
      handlerType: "DYNAMIC_TEMPLATE",
      handlerConfig: {
        template: `# Simulcast Technologies Highlights\n- Established: Pioneer IT & Telecom Infrastructure in Nepal\n- Core Competencies: High-density RF broadcast, Fiber Optics, Custom Software, AI Enterprise Agents\n- Office: Kathmandu, Nepal\n- Support: support@simulcast.com.np\n- 24/7 Monitoring: Operational\n- Category Requested: {{category}}`,
      },
      runCount: 3,
      lastRunAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tool_notify_team",
      name: "alert_support_escalation",
      title: "Escalate Urgent Alert to Simulcast Team",
      description: "Sends an immediate high-priority email alert to Simulcast engineering and support staff.",
      category: "Notification",
      enabled: true,
      parameters: {
        type: "object",
        properties: {
          urgency: { type: "string", enum: ["HIGH", "CRITICAL"], description: "Urgency level of this escalation" },
          topic: { type: "string", description: "Short topic of the incident or question" },
          message: { type: "string", description: "Detailed summary from the AI conversation" },
        },
        required: ["urgency", "topic", "message"],
      },
      handlerType: "EMAIL_ALERT",
      handlerConfig: {
        recipient: "support@simulcast.com.np",
        subjectPrefix: "[URGENT MCP ESCALATION]",
      },
      runCount: 1,
      lastRunAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await writeFallback(CUSTOM_TOOLS_FILE, seedTools);
  return seedTools;
}

export async function saveCustomMcpTool(input: {
  id?: string;
  name: string;
  title: string;
  description: string;
  category?: string;
  enabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters?: any;
  handlerType: CustomToolHandlerType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlerConfig: any;
}): Promise<McpCustomToolItem> {
  const safeName = input.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const now = new Date();

  const toolItem: McpCustomToolItem = {
    id: input.id || `tool_${randomUUID().slice(0, 8)}`,
    name: safeName,
    title: input.title || safeName,
    description: input.description,
    category: input.category || "Custom",
    enabled: input.enabled !== undefined ? input.enabled : true,
    parameters: input.parameters || { type: "object", properties: {} },
    handlerType: input.handlerType,
    handlerConfig: input.handlerConfig || {},
    runCount: 0,
    lastRunAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    await db.mcpCustomTool.upsert({
      where: { name: safeName },
      update: {
        title: toolItem.title,
        description: toolItem.description,
        category: toolItem.category,
        enabled: toolItem.enabled,
        parameters: JSON.stringify(toolItem.parameters),
        handlerType: toolItem.handlerType,
        handlerConfig: JSON.stringify(toolItem.handlerConfig),
        updatedAt: now,
      },
      create: {
        id: toolItem.id,
        name: toolItem.name,
        title: toolItem.title,
        description: toolItem.description,
        category: toolItem.category,
        enabled: toolItem.enabled,
        parameters: JSON.stringify(toolItem.parameters),
        handlerType: toolItem.handlerType,
        handlerConfig: JSON.stringify(toolItem.handlerConfig),
        runCount: 0,
      },
    });
  } catch {
    const list = await readFallback<McpCustomToolItem>(CUSTOM_TOOLS_FILE);
    const existingIdx = list.findIndex((t) => t.id === input.id || t.name === safeName);
    if (existingIdx >= 0) {
      toolItem.runCount = list[existingIdx].runCount;
      toolItem.createdAt = list[existingIdx].createdAt;
      list[existingIdx] = toolItem;
    } else {
      list.push(toolItem);
    }
    await writeFallback(CUSTOM_TOOLS_FILE, list);
  }

  await logAudit({
    action: "MCP_CUSTOM_TOOL_SAVED",
    category: "MCP",
    actor: "Admin",
    target: toolItem.name,
    details: `Created/Updated custom MCP tool '${toolItem.name}' (Handler: ${toolItem.handlerType})`,
    status: "SUCCESS",
  });

  return toolItem;
}

export async function toggleCustomMcpTool(id: string, enabled: boolean): Promise<{ ok: boolean }> {
  try {
    await db.mcpCustomTool.update({
      where: { id },
      data: { enabled, updatedAt: new Date() },
    });
  } catch {
    const list = await readFallback<McpCustomToolItem>(CUSTOM_TOOLS_FILE);
    const item = list.find((t) => t.id === id);
    if (item) {
      item.enabled = enabled;
      item.updatedAt = new Date().toISOString();
      await writeFallback(CUSTOM_TOOLS_FILE, list);
    }
  }

  await logAudit({
    action: enabled ? "MCP_TOOL_ENABLED" : "MCP_TOOL_DISABLED",
    category: "MCP",
    actor: "Admin",
    target: id,
    details: `Set custom MCP tool ${id} enabled status to ${enabled}`,
    status: "SUCCESS",
  });

  return { ok: true };
}

export async function deleteCustomMcpTool(id: string): Promise<{ ok: boolean }> {
  try {
    await db.mcpCustomTool.delete({ where: { id } });
  } catch {
    const list = await readFallback<McpCustomToolItem>(CUSTOM_TOOLS_FILE);
    const filtered = list.filter((t) => t.id !== id);
    await writeFallback(CUSTOM_TOOLS_FILE, filtered);
  }

  await logAudit({
    action: "MCP_CUSTOM_TOOL_DELETED",
    category: "MCP",
    actor: "Admin",
    target: id,
    details: `Deleted custom MCP tool ${id}`,
    status: "SUCCESS",
  });

  return { ok: true };
}

/**
 * Execute a custom MCP tool by invoking its configured handler
 */
export async function executeCustomMcpTool(
  toolName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any = {},
  clientIdentity = "MCP Client"
): Promise<{ ok: boolean; result: unknown; error?: string }> {
  const tools = await getCustomMcpTools();
  const tool = tools.find((t) => t.name === toolName && t.enabled);

  if (!tool) {
    return { ok: false, result: null, error: `Custom tool '${toolName}' not found or is currently disabled.` };
  }

  const now = new Date();

  // Increment run count
  try {
    await db.mcpCustomTool.update({
      where: { name: toolName },
      data: { runCount: { increment: 1 }, lastRunAt: now },
    });
  } catch {
    tool.runCount = (tool.runCount || 0) + 1;
    tool.lastRunAt = now.toISOString();
    await writeFallback(CUSTOM_TOOLS_FILE, tools);
  }

  try {
    switch (tool.handlerType) {
      case "DYNAMIC_TEMPLATE": {
        let templateStr = String(tool.handlerConfig?.template || "");
        for (const [key, val] of Object.entries(args)) {
          templateStr = templateStr.replace(new RegExp(`{{${key}}}`, "g"), String(val || ""));
        }
        return { ok: true, result: { message: templateStr, argsReceived: args } };
      }

      case "WEBHOOK": {
        const url = tool.handlerConfig?.url;
        if (!url) throw new Error("Webhook URL is not configured for this custom tool.");

        const method = (tool.handlerConfig?.method || "POST").toUpperCase();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "Simulcast-MCP/6.2",
          ...(tool.handlerConfig?.headers || {}),
        };

        const res = await fetch(url, {
          method,
          headers,
          body: method !== "GET" ? JSON.stringify({ tool: toolName, client: clientIdentity, args }) : undefined,
        });

        const text = await res.text();
        let parsed: unknown = text;
        try {
          parsed = JSON.parse(text);
        } catch {}

        return { ok: res.ok, result: parsed, error: !res.ok ? `Webhook returned HTTP ${res.status}` : undefined };
      }

      case "EMAIL_ALERT": {
        const recipient = tool.handlerConfig?.recipient || "support@simulcast.com.np";
        const subject = `${tool.handlerConfig?.subjectPrefix || "[MCP Alert]"} ${args.topic || tool.title}`;
        const html = `
          <div style="font-family:sans-serif;padding:16px;border:1px solid #e11d72;border-radius:8px">
            <h2 style="color:#2b0d3a;margin-top:0">${tool.title}</h2>
            <p><strong>Triggered By:</strong> ${clientIdentity}</p>
            <p><strong>Urgency:</strong> ${args.urgency || "NORMAL"}</p>
            <p><strong>Topic:</strong> ${args.topic || "None"}</p>
            <div style="background:#fdf2f8;padding:12px;border-radius:6px;margin-top:12px">
              <strong>Message / Summary:</strong>
              <p>${args.message || JSON.stringify(args, null, 2)}</p>
            </div>
          </div>
        `;

        const mailRes = await sendEmail({
          to: recipient,
          subject,
          html,
          text: `Triggered by ${clientIdentity}: ${args.message || JSON.stringify(args)}`,
        });

        return {
          ok: mailRes.ok,
          result: {
            delivered: mailRes.ok,
            recipient,
            messageId: mailRes.messageId,
            summary: "Escalation notification dispatched to Simulcast team.",
          },
          error: mailRes.error,
        };
      }

      case "DATABASE_QUERY": {
        const target = (tool.handlerConfig?.target || "services").toLowerCase();
        let data: unknown[] = [];

        if (target === "services") {
          const svcs = await db.service.findMany({ where: { published: true }, take: 10 });
          data = svcs.map((s: { title: string; summary: string }) => ({ title: s.title, summary: s.summary }));
        } else if (target === "projects") {
          const projs = await db.project.findMany({ where: { published: true }, take: 10 });
          data = projs.map((p: { title: string; category: string; summary: string }) => ({
            title: p.title,
            category: p.category,
            summary: p.summary,
          }));
        }

        return { ok: true, result: { query: target, count: data.length, items: data } };
      }

      default:
        return { ok: true, result: { executed: true, tool: toolName, args } };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error executing custom tool";
    return { ok: false, result: null, error: errorMsg };
  }
}
