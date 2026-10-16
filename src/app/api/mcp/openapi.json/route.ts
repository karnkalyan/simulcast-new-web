import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "";
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");

  if (host && !host.includes("localhost") && !host.startsWith("127.")) {
    return `${proto}://${host}`;
  }
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  return (envUrl || "https://www.simulcast.com.np").replace(/\/$/, "");
}

export async function GET(request: Request) {
  const serverUrl = resolveBaseUrl(request);

  const openapiSpec = {
    openapi: "3.1.0",
    info: {
      title: "Simulcast Technologies MCP & AI API",
      version: "6.2.0",
      description:
        "Official OpenAI Actions & MCP API for Simulcast Technologies Pvt. Ltd. (Nepal). Send emails directly from support@simulcast.com.np, inspect company solutions and SIMUL product lines, upload blog assets, and submit inquiries.",
      contact: {
        name: "Simulcast Engineering Support",
        email: "support@simulcast.com.np",
        url: "https://www.simulcast.com.np",
      },
    },
    servers: [
      {
        url: serverUrl,
        description: "Simulcast Production Server",
      },
    ],
    paths: {
      "/api/mcp/send-email": {
        post: {
          operationId: "sendEmail",
          summary: "Send email from Simulcast (support@simulcast.com.np)",
          description:
            "Dispatches an official email directly from Simulcast Technologies default support address (support@simulcast.com.np). Supports single or bulk recipients, HTML formatting, plain text fallback, attachments, CC, BCC, and background queueing.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    fromAccount: {
                      type: "string",
                      description: "Sender mailbox to dispatch from: 'support', 'info', 'sales', 'kalyan', or any configured email (e.g. info@simulcast.com.np). Defaults to 'support@simulcast.com.np'.",
                      enum: ["support", "info", "sales", "kalyan", "support@simulcast.com.np", "info@simulcast.com.np", "sales@simulcast.com.np", "kalyan@simulcast.com.np"],
                    },
                    to: {
                      type: "string",
                      description: "Recipient email address (e.g. karnkalyan@gmail.com)",
                    },
                    subject: {
                      type: "string",
                      description: "Subject of the email (supports dynamic {{variables}})",
                    },
                    message: {
                      type: "string",
                      description: "Plain text, conversational request, or Markdown message body (alternative to html)",
                    },
                    html: {
                      type: "string",
                      description: "HTML content or Markdown body (supports dynamic {{variables}})",
                    },
                    templateType: {
                      type: "string",
                      enum: ["COMPANY_PROFILE", "PRODUCT_PROPOSAL", "SUPPORT_TICKET", "CUSTOM"],
                      description: "Optional preset template. Set to COMPANY_PROFILE to automatically send the official Simulcast company and solutions brochure.",
                    },
                    variables: {
                      type: "object",
                      description: "Dynamic key-value variables to interpolate into subject and body (e.g. { name: 'Kalyan', company: 'Kisan ISP' })",
                    },
                    text: {
                      type: "string",
                      description: "Optional plain text alternative",
                    },
                    cc: {
                      type: "string",
                      description: "Optional CC email address",
                    },
                    bcc: {
                      type: "string",
                      description: "Optional BCC email address",
                    },
                    queue: {
                      type: "boolean",
                      description: "Set true to place into background queue, or false for immediate dispatch",
                    },
                    attachCompanyProfile: {
                      type: "boolean",
                      description: "Automatically attach the official Simulcast Corporate Profile PDF to this email",
                    },
                    attachment: {
                      type: "string",
                      description: "Quick attachment shortcut: 'company_profile', 'brochure', local path (e.g. /docs/...), or remote document URL",
                    },
                    attachments: {
                      type: "array",
                      description: "Optional array of file attachments with dynamic local paths, Base64 content, or remote URLs",
                      items: {
                        type: "object",
                        properties: {
                          filename: { type: "string", description: "Name of the file (e.g. Proposal.pdf)" },
                          url: { type: "string", description: "Remote URL of the file to attach (automatically downloaded)" },
                          path: { type: "string", description: "Path to uploaded file asset (e.g. /docs/... or /uploads/...)" },
                          content: { type: "string", description: "Base64 encoded file content or text string" },
                          contentType: { type: "string", description: "MIME type (e.g. application/pdf, image/png)" },
                        },
                        required: ["filename"],
                      },
                    },
                    recipients: {
                      type: "array",
                      description: "For dynamic bulk sending: array of recipients with per-person custom subjects, bodies, variables, and attachments",
                      items: {
                        type: "object",
                        properties: {
                          email: { type: "string" },
                          name: { type: "string" },
                          subject: { type: "string" },
                          html: { type: "string" },
                          vars: { type: "object" },
                        },
                        required: ["email"],
                      },
                    },
                  },
                  required: ["to"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Email dispatched successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      status: { type: "string" },
                      from: { type: "string" },
                      to: { type: "string" },
                      messageId: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/mcp/company-details": {
        get: {
          operationId: "getCompanyAndProductDetails",
          summary: "Get official Simulcast company details, product lines, and services",
          description:
            "Retrieves rich company overview, 12 solutions categories (Broadcasting, IPTV, OTT, Fiber Core Networks, SIMUL software products, AI agents), published service specs, and official contacts.",
          responses: {
            "200": {
              description: "Complete company and product profile",
            },
          },
        },
      },
      "/api/mcp/inquiry": {
        post: {
          operationId: "submitInquiryAndSendProfile",
          summary: "Submit client inquiry and automatically email company profile",
          description:
            "Logs a client inquiry in the Simulcast CRM system and immediately dispatches an automated company profile and product catalog email from support@simulcast.com.np to the requester.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", description: "Requester email address to receive company details" },
                    organization: { type: "string" },
                    phone: { type: "string" },
                    interest: { type: "string" },
                    message: { type: "string" },
                  },
                  required: ["name", "email", "message"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Inquiry registered and email dispatched",
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Enter your Simulcast MCP API Token or Master Key",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-mcp-key",
          description: "Simulcast MCP Key header",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
      {},
    ],
  };

  return NextResponse.json(openapiSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
