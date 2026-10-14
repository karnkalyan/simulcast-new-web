import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyMcpAuth } from "@/lib/mcp-auth";
import { sendHumanEscalationNotification } from "@/lib/email";
import { generateGeminiReply } from "@/lib/gemini";

export const dynamic = "force-dynamic";

// MCP Protocol Version
const MCP_PROTOCOL_VERSION = "2024-11-05";

// Tool Definitions
const TOOLS = [
  {
    name: "get_site_settings",
    description: "Get Simulcast Technologies official company details, slogans, contact information, and brand styling.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_services",
    description: "List all broadcast engineering, custom software, AI automation, and IT infrastructure services offered by Simulcast.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional filter category" },
      },
    },
  },
  {
    name: "list_projects",
    description: "Retrieve showcased real-world engineering projects deployed by Simulcast Technologies in Nepal.",
    inputSchema: {
      type: "object",
      properties: {
        featuredOnly: { type: "boolean", description: "Filter only featured projects" },
      },
    },
  },
  {
    name: "submit_inquiry",
    description: "Submit a new customer inquiry or project lead to Simulcast Technologies.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Contact full name" },
        email: { type: "string", description: "Contact email address" },
        organization: { type: "string", description: "Company or institution name" },
        phone: { type: "string", description: "Contact phone number" },
        interest: { type: "string", description: "Area of interest (e.g. Broadcast Playout, Software, AI)" },
        message: { type: "string", description: "Project description or questions" },
      },
      required: ["name", "email", "message"],
    },
  },
  {
    name: "request_human_agent",
    description: "Escalate visitor chat to human support engineers. Dispatches priority notification to the engineering support team.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Chat session ID" },
        visitorName: { type: "string", description: "Visitor's name" },
        visitorEmail: { type: "string", description: "Visitor's contact email" },
        message: { type: "string", description: "The reason or question needing human assistance" },
      },
      required: ["message"],
    },
  },
  {
    name: "ask_simulcast_ai",
    description: "Query the Simulcast AI Intelligence & Knowledge Engine with custom technical inquiries.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The technical or business inquiry" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_chat_history",
    description: "Retrieve the full transcript of a chat session.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Chat session ID to fetch" },
      },
      required: ["sessionId"],
    },
  },
];

const RESOURCES = [
  {
    uri: "simulcast://overview",
    name: "Company Overview",
    description: "High-level overview of Simulcast Technologies Pvt. Ltd., disciplines, and location.",
    mimeType: "text/plain",
  },
  {
    uri: "simulcast://services",
    name: "Services Catalog",
    description: "Complete list of broadcast, software, and AI capabilities.",
    mimeType: "application/json",
  },
];

// Handles JSON-RPC 2.0 MCP requests
export async function POST(request: Request) {
  let body: { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
      { status: 400 }
    );
  }

  const { jsonrpc = "2.0", id = null, method, params = {} } = body;

  // ChatGPT MCP connects unauthenticated first for handshake, tools listing, and discovery
  const isPublicMethod = method === "initialize" || method === "tools/list" || method === "resources/list" || method === "resources/read" || method === "ping";
  const toolName = (params as { name?: string })?.name;
  const isPublicToolCall = method === "tools/call" && (toolName === "get_site_settings" || toolName === "list_services" || toolName === "list_projects");

  const auth = await verifyMcpAuth(request);

  if (!isPublicMethod && !isPublicToolCall && !auth.authenticated) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32002, message: `Authentication required for this operation: ${auth.error || "Provide Authorization token"}` },
        id,
      },
      { status: 401 }
    );
  }

  switch (method) {
    case "initialize":
      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
          },
          serverInfo: {
            name: "simulcast-mcp-server",
            version: "1.0.0",
            description: "Simulcast Technologies Model Context Protocol Server",
          },
        },
      });

    case "tools/list":
      return NextResponse.json({
        jsonrpc,
        id,
        result: { tools: TOOLS },
      });

    case "resources/list":
      return NextResponse.json({
        jsonrpc,
        id,
        result: { resources: RESOURCES },
      });

    case "resources/read": {
      const uri = (params as { uri?: string })?.uri;
      if (uri === "simulcast://overview") {
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "text/plain",
                text: "Simulcast Technologies Pvt. Ltd. is an integrated technology engineering provider based in Kumaripati, Lalitpur, Nepal. Specialties include 24/7 master control broadcast playout, CG, NRCS, IPTV/OTT/DTH, telecom OSS/BSS, custom software platforms, and AI automation.",
              },
            ],
          },
        });
      }
      if (uri === "simulcast://services") {
        const services = await prisma.service.findMany({ where: { published: true } });
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(services, null, 2),
              },
            ],
          },
        });
      }
      return NextResponse.json({
        jsonrpc,
        id,
        error: { code: -32602, message: `Resource not found: ${uri}` },
      });
    }

    case "tools/call": {
      const toolName = (params as { name?: string })?.name;
      const args = ((params as { arguments?: Record<string, unknown> })?.arguments || {}) as Record<string, unknown>;

      try {
        if (toolName === "get_site_settings") {
          const settings = await prisma.siteSettings.findFirst();
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(settings, null, 2),
                },
              ],
            },
          });
        }

        if (toolName === "list_services") {
          const services = await prisma.service.findMany({
            where: { published: true },
            orderBy: { sortOrder: "asc" },
          });
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(services, null, 2),
                },
              ],
            },
          });
        }

        if (toolName === "list_projects") {
          const featuredOnly = Boolean(args.featuredOnly);
          const whereClause = featuredOnly ? { published: true, featured: true } : { published: true };
          const projects = await prisma.project.findMany({
            where: whereClause,
            orderBy: { sortOrder: "asc" },
          });
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(projects, null, 2),
                },
              ],
            },
          });
        }

        if (toolName === "submit_inquiry") {
          const { name, email, organization = "", phone = "", interest = "", message } = args as Record<string, string>;
          if (!name || !email || !message) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "name, email, and message are required" },
            });
          }

          const inquiry = await prisma.inquiry.create({
            data: {
              name,
              email,
              organization,
              phone,
              interest,
              message,
              internalNotes: `Submitted via MCP Client: ${auth.identity}`,
            },
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Inquiry successfully logged with ID #${inquiry.id}. The Simulcast engineering team will review it.`,
                },
              ],
            },
          });
        }

        if (toolName === "request_human_agent") {
          const { sessionId, visitorName = "MCP Client User", visitorEmail = "", message } = args as Record<string, string>;
          let targetSessionId = sessionId;

          if (!targetSessionId) {
            const newSession = await prisma.chatSession.create({
              data: {
                visitorId: "mcp-agent-" + Math.random().toString(36).slice(2, 7),
                visitorName,
                visitorEmail,
                status: "ESCALATED_HUMAN",
                escalatedAt: new Date(),
              },
            });
            targetSessionId = newSession.id;
          } else {
            await prisma.chatSession.update({
              where: { id: targetSessionId },
              data: { status: "ESCALATED_HUMAN", escalatedAt: new Date() },
            });
          }

          await prisma.chatMessage.create({
            data: {
              sessionId: targetSessionId,
              sender: "user",
              senderName: visitorName,
              content: `[Human Escalation Request via MCP]: ${message}`,
            },
          });

          // Dispatch email alert to info@simulcast.com.np & support@simulcast.com.np
          await sendHumanEscalationNotification({
            sessionId: targetSessionId,
            visitorName,
            visitorEmail,
            latestMessage: message,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Human escalation alert sent to engineering support team for session #${targetSessionId}. A representative is standing by.`,
                },
              ],
            },
          });
        }

        if (toolName === "ask_simulcast_ai") {
          const query = String(args.query || "");
          const reply = await generateGeminiReply([], query);
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: reply.text,
                },
              ],
            },
          });
        }

        if (toolName === "get_chat_history") {
          const sessionId = String(args.sessionId || "");
          const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          });

          if (!session) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Session ${sessionId} not found` },
            });
          }

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(session, null, 2),
                },
              ],
            },
          });
        }

        return NextResponse.json({
          jsonrpc,
          id,
          error: { code: -32601, message: `Unknown tool: ${toolName}` },
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
          jsonrpc,
          id,
          error: { code: -32000, message: `Tool execution failed: ${errorMsg}` },
        });
      }
    }

    default:
      return NextResponse.json({
        jsonrpc,
        id,
        error: { code: -32601, message: `Method not implemented: ${method}` },
      });
  }
}

// GET /api/mcp - returns server info & metadata
export async function GET() {
  return NextResponse.json({
    name: "Simulcast Technologies Model Context Protocol (MCP) Server",
    version: "1.0.0",
    protocolVersion: MCP_PROTOCOL_VERSION,
    status: "online",
    endpoints: {
      jsonRpc: "/api/mcp",
      sse: "/api/mcp/sse",
      ws: "/api/mcp/ws",
    },
    toolsCount: TOOLS.length,
    resourcesCount: RESOURCES.length,
    authRequired: true,
    authType: "Bearer JWT or x-mcp-key / x-api-key",
  });
}
