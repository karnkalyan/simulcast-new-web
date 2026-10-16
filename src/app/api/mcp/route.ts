import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyMcpAuth } from "@/lib/mcp-auth";
import { sendHumanEscalationNotification, sendChatTranscriptEmail, sendEmail, type EmailAttachment } from "@/lib/email";
import { generateGeminiReply } from "@/lib/gemini";
import { guides } from "@/lib/editorial";
import { fallbackSettings, staticServices, staticProjects } from "@/lib/constants";
import {
  enqueueEmail,
  enqueueBulkEmails,
  processEmailQueue,
  getEmailQueue,
  getEmailLogs,
  retryFailedEmails,
  clearEmailQueue,
  recordEmailLog,
} from "@/lib/email-queue";
import { logAudit, getAuditLogs } from "@/lib/audit";
import { getCustomMcpTools, executeCustomMcpTool } from "@/lib/mcp-manager";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

async function saveImageBuffer({
  buffer,
  originalFilename,
  mimeType,
  alt = "",
}: {
  buffer: Buffer;
  originalFilename?: string;
  mimeType?: string;
  alt?: string;
}): Promise<{ path: string; filename: string; size: number; mimeType: string }> {
  const formats: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  let ext = mimeType ? formats[mimeType] : undefined;
  if (!ext && originalFilename) {
    const extMatch = originalFilename.split(".").pop()?.toLowerCase();
    if (extMatch && ["png", "jpg", "jpeg", "webp", "avif"].includes(extMatch)) {
      ext = extMatch === "jpeg" ? "jpg" : extMatch;
    }
  }
  if (!ext) ext = "webp";
  const finalMime = mimeType || `image/${ext === "jpg" ? "jpeg" : ext}`;
  const filename = `${randomUUID()}.${ext}`;
  const uploadsFolder = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsFolder, { recursive: true });
  await fs.writeFile(path.join(uploadsFolder, filename), buffer);

  const finalPath = `/uploads/${filename}`;
  try {
    await prisma.mediaAsset.create({
      data: {
        filename: (originalFilename || filename).slice(0, 191),
        path: finalPath,
        mimeType: finalMime,
        size: buffer.length,
        alt: alt.slice(0, 255),
      },
    });
  } catch {}

  return {
    path: finalPath,
    filename: originalFilename || filename,
    size: buffer.length,
    mimeType: finalMime,
  };
}

export const dynamic = "force-dynamic";

// MCP Protocol Version
const MCP_PROTOCOL_VERSION = "2024-11-05";


// Tool Definitions (Compliant with MCP 2024-11-05 & OpenAI Apps SDK 2025/2026 specs)
const TOOLS = [
  // 1. SITE SETTINGS, THEME & BRAND CONTROL
  {
    name: "get_site_settings",
    description: "Get Simulcast Technologies official company details, slogans, contact information, theme colors, and brand styling.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "update_site_settings",
    description: "Update complete company details, theme colors, headlines, slogans, hero badges, contact information, social links, custom CSS, and chat greeting.",
    scopes: ["admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        companyName: { type: "string", description: "Official company name" },
        headline: { type: "string", description: "Main homepage headline" },
        subheadline: { type: "string", description: "Subheadline description" },
        slogan: { type: "string", description: "Company slogan / tagline" },
        website: { type: "string", description: "Official website URL" },
        publicEmail: { type: "string", description: "Public contact email" },
        phone: { type: "string", description: "Official contact phone numbers" },
        address: { type: "string", description: "Physical office address" },
        facebook: { type: "string", description: "Facebook profile URL" },
        linkedin: { type: "string", description: "LinkedIn company URL" },
        youtube: { type: "string", description: "YouTube channel URL" },
        instagram: { type: "string", description: "Instagram profile URL" },
        seoDescription: { type: "string", description: "Meta SEO description for search engines" },
        primaryColor: { type: "string", description: "Primary brand theme hex color (e.g. #2b0d3a or #0f172a)" },
        secondaryColor: { type: "string", description: "Secondary accent hex color (e.g. #e11d72 or #0284c7)" },
        heroBgColor: { type: "string", description: "Hero background theme color" },
        heroBadgeText: { type: "string", description: "Eyebrow badge text on hero banner" },
        heroEmphasis: { type: "string", description: "Hero emphasis gradient text" },
        customCss: { type: "string", description: "Optional custom CSS styling override" },
        enableChat: { type: "boolean", description: "Enable or disable website live chat widget" },
        chatGreeting: { type: "string", description: "Initial greeting message from live chat" },
        supportEmail: { type: "string", description: "Designated support email address" },
        escalationEmail: { type: "string", description: "Escalation notification email address" },
      },
    },
  },

  // 2. SERVICES CRUD
  {
    name: "list_services",
    description: "List all broadcast engineering, custom software, AI automation, and IT infrastructure services offered by Simulcast.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional filter category" },
        includeDrafts: { type: "boolean", description: "Include unpublished draft services (default false)" },
      },
    },
  },
  {
    name: "get_service",
    description: "Retrieve complete details, technical scope, and architecture specifications for a specific Simulcast service by its slug or ID.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Service unique slug (e.g. broadcast-media, software-platforms, ai-automation)" },
        id: { type: "string", description: "Service unique database ID" },
      },
    },
  },
  {
    name: "create_service",
    description: "Create and publish a new engineering, broadcast, software, or AI service on the website.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Service title" },
        slug: { type: "string", description: "Unique URL slug (e.g. cloud-playout-systems)" },
        summary: { type: "string", description: "Concise summary of the service offering" },
        body: { type: "string", description: "Full technical description, architecture, and specifications" },
        eyebrow: { type: "string", description: "Category/index eyebrow (e.g. 07 / CLOUD SYSTEMS)" },
        icon: { type: "string", description: "Icon identifier (e.g. radio-tower, code-2, brain-circuit, server, blocks, headset)" },
        imageUrl: { type: "string", description: "Cover image asset URL" },
        sortOrder: { type: "integer", description: "Ordering rank on website (default 0)" },
        published: { type: "boolean", description: "Whether service is published immediately (default true)" },
      },
      required: ["title", "slug", "summary", "body"],
    },
  },
  {
    name: "update_service",
    description: "Update an existing service's title, description, body, icon, image, sort order, or publish status.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Current slug of the service to update" },
        id: { type: "string", description: "Database ID of the service to update" },
        title: { type: "string", description: "Updated title" },
        newSlug: { type: "string", description: "Updated slug if renaming URL" },
        eyebrow: { type: "string", description: "Updated eyebrow label" },
        summary: { type: "string", description: "Updated summary" },
        body: { type: "string", description: "Updated body text" },
        icon: { type: "string", description: "Updated icon identifier" },
        imageUrl: { type: "string", description: "Updated image asset URL" },
        sortOrder: { type: "integer", description: "Updated sort order" },
        published: { type: "boolean", description: "Set published or draft status" },
      },
    },
  },
  {
    name: "delete_service",
    description: "Permanently delete a service from the website by its slug or ID.",
    scopes: ["admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug of the service to delete" },
        id: { type: "string", description: "Database ID of the service to delete" },
      },
    },
  },

  // 3. PROJECTS CRUD
  {
    name: "list_projects",
    description: "Retrieve showcased real-world engineering projects deployed by Simulcast Technologies in Nepal.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter projects by category" },
        featuredOnly: { type: "boolean", description: "Filter only featured projects" },
        includeDrafts: { type: "boolean", description: "Include unpublished draft projects (default false)" },
      },
    },
  },
  {
    name: "get_project",
    description: "Retrieve complete details, architecture study, and specifications of a showcase engineering deployment.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Project unique slug (e.g. broadcast-operations-concept)" },
        id: { type: "string", description: "Project database ID" },
      },
    },
  },
  {
    name: "create_project",
    description: "Publish a new showcase project or case study deployment.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Project title" },
        slug: { type: "string", description: "Unique URL slug" },
        category: { type: "string", description: "Category (e.g. Broadcast Engineering, Streaming Infrastructure, Data Center & Networks, Software & Automation)" },
        summary: { type: "string", description: "High-level summary" },
        body: { type: "string", description: "Detailed case study description" },
        location: { type: "string", description: "Deployment location (e.g. Lalitpur, Nepal)" },
        imageUrl: { type: "string", description: "Cover image URL" },
        featured: { type: "boolean", description: "Feature on homepage (default false)" },
        published: { type: "boolean", description: "Publish immediately or save as draft (default true)" },
        sortOrder: { type: "integer", description: "Ordering priority (default 0)" },
      },
      required: ["title", "slug", "summary", "body"],
    },
  },
  {
    name: "update_project",
    description: "Update an existing showcase project's title, summary, case study body, category, location, image, or featured status.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Current slug of the project to update" },
        id: { type: "string", description: "Database ID of the project to update" },
        title: { type: "string", description: "Updated title" },
        newSlug: { type: "string", description: "Updated slug if renaming URL" },
        category: { type: "string", description: "Updated category" },
        summary: { type: "string", description: "Updated summary" },
        body: { type: "string", description: "Updated body content" },
        location: { type: "string", description: "Updated location" },
        imageUrl: { type: "string", description: "Updated cover image URL" },
        featured: { type: "boolean", description: "Feature on homepage" },
        published: { type: "boolean", description: "Publish or unpublish" },
        sortOrder: { type: "integer", description: "Ordering priority" },
      },
    },
  },
  {
    name: "delete_project",
    description: "Permanently delete a showcase project by its slug or ID.",
    scopes: ["admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug of the project to delete" },
        id: { type: "string", description: "Database ID of the project to delete" },
      },
    },
  },

  // 4. BLOGS / INSIGHTS / ARTICLES CRUD
  {
    name: "list_blog_posts",
    description: "List recent blog/insights posts with filtering by category and publish status.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category (e.g. Broadcast engineering, Streaming technology, Telecom & ISP, AI & automation)" },
        publishedOnly: { type: "boolean", description: "Whether to return only published posts (default true)" },
      },
    },
  },
  {
    name: "get_blog_post",
    description: "Retrieve a specific blog post or engineering guide by its unique URL slug or ID.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The slug of the article (e.g. broadcast-playout-automation-nepal)" },
        id: { type: "string", description: "Database ID of the article" },
      },
    },
  },
  {
    name: "create_blog_post",
    description: "Create and optionally publish a new insight or blog article on the website with image upload or image URL.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Article title" },
        slug: { type: "string", description: "Unique URL slug (e.g. next-gen-iptv-nepal)" },
        excerpt: { type: "string", description: "Brief executive summary of the post" },
        body: { type: "string", description: "Full markdown or text content of the article" },
        category: { type: "string", description: "Category (e.g. Broadcast engineering, Streaming technology, Telecom & ISP, Applied AI, Software & IT Consulting)" },
        imageUrl: { type: "string", description: "Image asset path or direct URL (e.g. /uploads/image.webp or https://...)" },
        imageBase64: { type: "string", description: "Base64 encoded image string or data URL to upload and set as the article cover image" },
        imageFilename: { type: "string", description: "Optional filename for the uploaded image (e.g. ai-cloud-playout.png)" },
        imageAlt: { type: "string", description: "Alt text for the image" },
        published: { type: "boolean", description: "Publish immediately or save as draft (default true)" },
      },
      required: ["title", "slug", "excerpt", "body"],
    },
  },
  {
    name: "update_blog_post",
    description: "Update an existing insight/blog post by its slug or ID, including updating or uploading cover image.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Current slug of the post to update" },
        id: { type: "string", description: "Database ID of the post to update" },
        title: { type: "string", description: "Updated title" },
        newSlug: { type: "string", description: "Updated slug if renaming URL" },
        excerpt: { type: "string", description: "Updated excerpt" },
        body: { type: "string", description: "Updated full article body" },
        category: { type: "string", description: "Updated category" },
        imageUrl: { type: "string", description: "Updated image URL or path" },
        imageBase64: { type: "string", description: "Base64 encoded image to upload as new cover image" },
        imageFilename: { type: "string", description: "Optional filename for the uploaded image" },
        published: { type: "boolean", description: "Set published status" },
      },
    },
  },
  {
    name: "delete_blog_post",
    description: "Permanently delete a blog article or insight by slug or ID.",
    scopes: ["admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug of the article to delete" },
        id: { type: "string", description: "Database ID of the article to delete" },
      },
    },
  },

  // 5. CONTACT INQUIRIES & LEADS
  {
    name: "submit_inquiry",
    description: "Submit a new customer inquiry or project lead to Simulcast Technologies.",
    scopes: ["mcp:write"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
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
    name: "list_inquiries",
    description: "List customer inquiries, sales leads, and contact submissions received through the website.",
    scopes: ["mcp:read", "admin"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: NEW, IN_PROGRESS, RESPONDED, CLOSED, or ALL" },
        limit: { type: "integer", description: "Max number of records to return (default 25)" },
      },
    },
  },
  {
    name: "get_inquiry",
    description: "Retrieve complete details, message, and internal notes for a specific customer inquiry by ID.",
    scopes: ["mcp:read", "admin"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Inquiry ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "update_inquiry",
    description: "Update customer inquiry status (NEW, IN_PROGRESS, RESPONDED, CLOSED) and append internal follow-up notes.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Inquiry ID" },
        status: { type: "string", description: "New status (NEW, IN_PROGRESS, RESPONDED, CLOSED)" },
        internalNotes: { type: "string", description: "Staff notes or follow-up summary" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_inquiry",
    description: "Permanently delete a customer contact inquiry by its ID.",
    scopes: ["admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Inquiry ID to delete" },
      },
      required: ["id"],
    },
  },

  // 6. SIMULCAST LIVE CHAT SYSTEM
  {
    name: "list_chat_sessions",
    description: "List website visitor live chat sessions, with visitor details, escalation status, and latest message previews.",
    scopes: ["mcp:read", "admin"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: ACTIVE, ESCALATED_HUMAN, CLOSED, or ALL" },
        limit: { type: "integer", description: "Max sessions to return (default 25)" },
      },
    },
  },
  {
    name: "get_chat_history",
    description: "Retrieve the full transcript of a chat session, including visitor details and all messages in chronological order.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Chat session ID to fetch" },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "send_chat_message",
    description: "Send a live chat response to a website visitor in an active or escalated session from ChatGPT or a human representative.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Target chat session ID" },
        content: { type: "string", description: "Message content to send to visitor" },
        sender: { type: "string", description: "Sender role: human_agent, bot, system (default human_agent)" },
        senderName: { type: "string", description: "Display name (default 'Simulcast Support Representative')" },
      },
      required: ["sessionId", "content"],
    },
  },
  {
    name: "update_chat_session",
    description: "Update chat session metadata, contact details (name, email, phone), escalation status, or staff summary.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Chat session ID" },
        status: { type: "string", description: "New status: ACTIVE, ESCALATED_HUMAN, or CLOSED" },
        visitorName: { type: "string", description: "Visitor's name" },
        visitorEmail: { type: "string", description: "Visitor's email address" },
        visitorPhone: { type: "string", description: "Visitor's phone number" },
        summary: { type: "string", description: "Staff summary of session" },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "close_chat_session",
    description: "Mark a live chat session as CLOSED and optionally email the complete transcript to support and the visitor.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Chat session ID to close" },
        sendTranscriptEmail: { type: "boolean", description: "Whether to dispatch email transcript to support team (default false)" },
        summary: { type: "string", description: "Optional closing resolution summary" },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "request_human_agent",
    description: "Escalate visitor chat to human support engineers. Dispatches priority notification to the engineering support team.",
    scopes: ["mcp:write"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
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

  // 7. AI ENGINE
  {
    name: "ask_simulcast_ai",
    description: "Query the Simulcast AI Intelligence & Knowledge Engine with custom technical inquiries.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The technical or business inquiry" },
      },
      required: ["query"],
    },
  },

  // 8. MEDIA & IMAGE ASSET MANAGEMENT
  {
    name: "upload_media_image",
    description: "Upload an image asset (PNG, JPG, WEBP, AVIF) to the Simulcast media library from base64 data or an external image URL, making it immediately available for insights, blog posts, services, or showcase projects.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string", description: "Desired filename (e.g. broadcast-operations.webp or insight-header.png)" },
        data: { type: "string", description: "Base64 encoded image string or data URL (e.g. data:image/png;base64,...)" },
        url: { type: "string", description: "External image URL to download and save into Simulcast media library" },
        alt: { type: "string", description: "Descriptive alt text for accessibility and SEO" },
        mimeType: { type: "string", description: "Mime type (e.g. image/webp, image/png, image/jpeg)" },
      },
    },
  },
  {
    name: "list_media_assets",
    description: "List uploaded images and branded media assets available in the Simulcast library.",
    scopes: ["mcp:read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max assets to return (default 50)" },
      },
    },
  },

  // 9. EMAIL DISPATCH, ATTACHMENTS & QUEUE MANAGEMENT
  {
    name: "send_email",
    description: "Send an email immediately or add it to the background queue with full attachment support, CC, BCC, HTML body, and delivery logging.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        to: {
          description: "Target email address (string or array of email strings)",
        },
        subject: { type: "string", description: "Email subject line" },
        html: { type: "string", description: "HTML message content" },
        text: { type: "string", description: "Optional plain text fallback" },
        cc: {
          description: "Optional CC recipients (string or array of strings)",
        },
        bcc: {
          description: "Optional BCC recipients (string or array of strings)",
        },
        attachments: {
          type: "array",
          description: "Optional attachments",
          items: {
            type: "object",
            properties: {
              filename: { type: "string", description: "Name of the attached file" },
              content: { type: "string", description: "Base64 encoded string or raw text content" },
              path: { type: "string", description: "Local path to an uploaded asset (e.g. /uploads/...)" },
              contentType: { type: "string", description: "MIME type (e.g. application/pdf, image/png)" },
            },
            required: ["filename"],
          },
        },
        queue: { type: "boolean", description: "Whether to place into background queue (default false for single email, true for bulk)" },
        priority: { type: "integer", description: "Priority level from 0 (normal) to 10 (urgent)" },
      },
      required: ["to", "subject", "html"],
    },
  },
  {
    name: "send_bulk_emails",
    description: "Queue bulk emails (e.g. 100+ emails) into the Simulcast queue system with batch tracking, template variable interpolation ({{email}}, {{name}}), and attachment support.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        recipients: {
          type: "array",
          description: "Array of email addresses (e.g. ['client1@example.com', 'client2@example.com']) or objects with name and custom variables",
          items: {
            type: "object",
            description: "Email recipient info or string",
          },
        },
        subject: { type: "string", description: "Email subject line (supports {{name}} and {{email}})" },
        html: { type: "string", description: "HTML body (supports {{name}} and {{email}})" },
        text: { type: "string", description: "Optional plain text fallback" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              content: { type: "string" },
              path: { type: "string" },
              contentType: { type: "string" },
            },
            required: ["filename"],
          },
        },
        batchName: { type: "string", description: "Optional label for this batch (e.g. 'newsletter-october')" },
        priority: { type: "integer", description: "Priority 0-10 (default 0)" },
      },
      required: ["recipients", "subject", "html"],
    },
  },
  {
    name: "get_email_queue_status",
    description: "Get real-time statistics and records from the email queue (pending, processing, sent, failed counts).",
    scopes: ["mcp:read", "admin"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: PENDING, PROCESSING, SENT, FAILED, or ALL" },
        batchId: { type: "string", description: "Filter by batch ID" },
        limit: { type: "integer", description: "Max records to return (default 25)" },
      },
    },
  },
  {
    name: "process_email_queue",
    description: "Trigger background email queue processor to send next batch of pending emails.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        batchSize: { type: "integer", description: "Number of emails to process in this run (default 25, max 100)" },
      },
    },
  },
  {
    name: "get_email_logs",
    description: "Retrieve history and audit trail of sent and attempted emails with delivery status, message IDs, and diagnostics.",
    scopes: ["mcp:read", "admin"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: SENT, FAILED, QUEUED, or ALL" },
        search: { type: "string", description: "Search term for recipient email or subject" },
        limit: { type: "integer", description: "Max log entries to return (default 50)" },
      },
    },
  },
  {
    name: "retry_failed_emails",
    description: "Reset failed emails in the queue back to PENDING so they will be retried.",
    scopes: ["mcp:write", "admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Specific queue item ID to retry (or leave empty to retry all failed)" },
      },
    },
  },
  {
    name: "clear_email_queue",
    description: "Clear completed or failed emails from the queue.",
    scopes: ["admin"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openAiConfirmationRequired: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter to clear: SENT, FAILED, or ALL" },
      },
    },
  },
  {
    name: "get_audit_logs",
    description: "Retrieve system audit trail records covering MCP calls, content modifications, media uploads, and email actions.",
    scopes: ["mcp:read", "admin"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openAiConfirmationRequired: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter category: MCP, EMAIL, INSIGHTS, MEDIA, AUTH, or ALL" },
        search: { type: "string", description: "Search by actor, action, or target" },
        limit: { type: "integer", description: "Max logs to retrieve (default 50)" },
      },
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
  {
    uri: "simulcast://projects",
    name: "Projects Portfolio",
    description: "Engineering case studies and broadcast deployments across Nepal.",
    mimeType: "application/json",
  },
  {
    uri: "simulcast://inquiries/summary",
    name: "Recent Inquiries Summary",
    description: "Summary of customer requests and lead pipeline.",
    mimeType: "application/json",
  },
  {
    uri: "simulcast://chat/active",
    name: "Active Chat Sessions",
    description: "Active visitor live chat conversations waiting for response.",
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

  // MCP discovery, handshake, and telemetry methods must never require authentication
  const isDiscoveryMethod =
    method === "initialize" ||
    method === "notifications/initialized" ||
    method === "tools/list" ||
    method === "resources/list" ||
    method === "resources/read" ||
    method === "resources/templates/list" ||
    method === "prompts/list" ||
    method === "prompts/get" ||
    method === "ping" ||
    method === "logging/setLevel";

  const toolName = (params as { name?: string })?.name;
  const isPublicToolCall =
    method === "tools/call" &&
    (toolName === "get_site_settings" ||
      toolName === "list_services" ||
      toolName === "get_service" ||
      toolName === "list_projects" ||
      toolName === "get_project" ||
      toolName === "ask_simulcast_ai" ||
      toolName === "list_blog_posts" ||
      toolName === "get_blog_post" ||
      toolName === "submit_inquiry" ||
      toolName === "request_human_agent" ||
      toolName === "list_media_assets");

  const auth = await verifyMcpAuth(request, toolName);

  const isExplicitlyDisconnected = Boolean(auth.error && auth.error.toLowerCase().includes("disconnected"));

  if (isExplicitlyDisconnected || (!isDiscoveryMethod && !isPublicToolCall && !auth.authenticated)) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32002, message: `Authentication required for this operation: ${auth.error || "Provide Authorization token"}` },
        id,
      },
      {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-key, x-api-key",
        },
      }
    );
  }

  switch (method) {
    case "initialize": {
      const clientVersion = (params as { protocolVersion?: string })?.protocolVersion;
      return NextResponse.json(
        {
          jsonrpc,
          id,
          result: {
            protocolVersion: clientVersion || MCP_PROTOCOL_VERSION,
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
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-key, x-api-key",
          },
        }
      );
    }

    case "notifications/initialized":
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });

    case "ping":
      return NextResponse.json(
        { jsonrpc, id, result: {} },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

    case "prompts/list":
      return NextResponse.json(
        { jsonrpc, id, result: { prompts: [] } },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

    case "resources/templates/list":
      return NextResponse.json(
        { jsonrpc, id, result: { resourceTemplates: [] } },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

    case "tools/list": {
      let customToolDefs: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> = [];
      try {
        const customTools = await getCustomMcpTools();
        customToolDefs = customTools
          .filter((t) => t.enabled)
          .map((t) => ({
            name: t.name,
            description: `[Custom Tool / ${t.category}] ${t.description}`,
            inputSchema: (t.parameters as Record<string, unknown>) || { type: "object", properties: {} },
          }));
      } catch (err) {
        console.error("Failed to load custom tools for tools/list:", err);
      }

      return NextResponse.json({
        jsonrpc,
        id,
        result: { tools: [...TOOLS, ...customToolDefs] },
      });
    }

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
        let services: Array<Record<string, unknown>> = [];
        try {
          services = (await prisma.service.findMany({ where: { published: true } })) as unknown as Array<Record<string, unknown>>;
        } catch {}
        const finalServices = services.length > 0 ? services : staticServices;
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(finalServices, null, 2),
              },
            ],
          },
        });
      }
      if (uri === "simulcast://projects") {
        let projects: Array<Record<string, unknown>> = [];
        try {
          projects = (await prisma.project.findMany({ where: { published: true } })) as unknown as Array<Record<string, unknown>>;
        } catch {}
        const finalProjects = projects.length > 0 ? projects : staticProjects;
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(finalProjects, null, 2),
              },
            ],
          },
        });
      }
      if (uri === "simulcast://inquiries/summary") {
        let inquiries: Array<Record<string, unknown>> = [];
        try {
          inquiries = (await prisma.inquiry.findMany({ take: 10, orderBy: { createdAt: "desc" } })) as unknown as Array<Record<string, unknown>>;
        } catch {}
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(inquiries, null, 2),
              },
            ],
          },
        });
      }
      if (uri === "simulcast://chat/active") {
        let activeSessions: Array<Record<string, unknown>> = [];
        try {
          activeSessions = (await prisma.chatSession.findMany({
            where: { status: { in: ["ACTIVE", "ESCALATED_HUMAN"] } },
            take: 10,
            orderBy: { updatedAt: "desc" },
          })) as unknown as Array<Record<string, unknown>>;
        } catch {}
        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(activeSessions, null, 2),
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
        // ==========================================
        // 1. SITE SETTINGS & BRAND / THEME
        // ==========================================
        if (toolName === "get_site_settings") {
          let settings = null;
          try {
            settings = await prisma.siteSettings.findFirst();
          } catch {}
          const finalSettings = settings || fallbackSettings;
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(finalSettings, null, 2),
                },
              ],
            },
          });
        }

        if (toolName === "update_site_settings") {
          const data: Record<string, unknown> = {};
          if (typeof args.companyName === "string") data.companyName = args.companyName;
          if (typeof args.headline === "string") data.headline = args.headline;
          if (typeof args.subheadline === "string") data.subheadline = args.subheadline;
          if (typeof args.slogan === "string") data.slogan = args.slogan;
          if (typeof args.website === "string") data.website = args.website;
          if (typeof args.publicEmail === "string") data.publicEmail = args.publicEmail;
          if (typeof args.phone === "string") data.phone = args.phone;
          if (typeof args.address === "string") data.address = args.address;
          if (typeof args.facebook === "string") data.facebook = args.facebook;
          if (typeof args.linkedin === "string") data.linkedin = args.linkedin;
          if (typeof args.youtube === "string") data.youtube = args.youtube;
          if (typeof args.instagram === "string") data.instagram = args.instagram;
          if (typeof args.seoDescription === "string") data.seoDescription = args.seoDescription;
          if (typeof args.primaryColor === "string") data.primaryColor = args.primaryColor;
          if (typeof args.secondaryColor === "string") data.secondaryColor = args.secondaryColor;
          if (typeof args.heroBgColor === "string") data.heroBgColor = args.heroBgColor;
          if (typeof args.heroBadgeText === "string") data.heroBadgeText = args.heroBadgeText;
          if (typeof args.heroEmphasis === "string") data.heroEmphasis = args.heroEmphasis;
          if (typeof args.customCss === "string") data.customCss = args.customCss;
          if (typeof args.enableChat === "boolean") data.enableChat = args.enableChat;
          if (typeof args.chatGreeting === "string") data.chatGreeting = args.chatGreeting;
          if (typeof args.supportEmail === "string") data.supportEmail = args.supportEmail;
          if (typeof args.escalationEmail === "string") data.escalationEmail = args.escalationEmail;

          const settings = await prisma.siteSettings.upsert({
            where: { id: "main" },
            update: data,
            create: {
              id: "main",
              headline: String(data.headline || "Broadcasting. Software. AI Systems."),
              subheadline: String(data.subheadline || "Simulcast Technologies integrated engineering solutions in Nepal."),
              seoDescription: String(data.seoDescription || "Simulcast Technologies Pvt. Ltd."),
              ...data,
            },
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Site settings and brand theme updated successfully:\n${JSON.stringify(settings, null, 2)}` }],
            },
          });
        }

        // ==========================================
        // 2. SERVICES CRUD
        // ==========================================
        if (toolName === "list_services") {
          const category = args.category ? String(args.category).toLowerCase().trim() : undefined;
          const includeDrafts = Boolean(args.includeDrafts);
          const whereClause: { published?: boolean } = {};
          if (!includeDrafts) whereClause.published = true;

          let services: Array<Record<string, unknown>> = [];
          try {
            services = (await prisma.service.findMany({
              where: whereClause,
              orderBy: { sortOrder: "asc" },
            })) as unknown as Array<Record<string, unknown>>;
          } catch {}

          const finalServices = services && services.length > 0 ? services : staticServices;
          const filtered = category
            ? finalServices.filter(
                (s) =>
                  String(s.title || "").toLowerCase().includes(category) ||
                  String(s.eyebrow || "").toLowerCase().includes(category) ||
                  String(s.summary || "").toLowerCase().includes(category)
              )
            : finalServices;

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(filtered, null, 2),
                },
              ],
            },
          });
        }

        if (toolName === "get_service") {
          const target = String(args.slug || args.id || "").trim();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required" } });
          }

          let service = await prisma.service.findFirst({
            where: {
              OR: [{ slug: target }, { id: target }],
            },
          });

          if (!service) {
            const staticMatch = staticServices.find((s) => s.slug === target || s.id === target);
            if (staticMatch) {
              service = {
                ...staticMatch,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as unknown as typeof service;
            }
          }

          if (!service) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Service "${target}" not found` },
            });
          }

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(service, null, 2) }],
            },
          });
        }

        if (toolName === "create_service") {
          const title = String(args.title || "").trim();
          const slug = String(args.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
          const summary = String(args.summary || "").trim();
          const bodyText = String(args.body || "").trim();
          const eyebrow = String(args.eyebrow || "").trim();
          const icon = String(args.icon || "layers").trim();
          const imageUrl = String(args.imageUrl || "/visuals/neon_himalayan_broadcast_control_room.webp").trim();
          const sortOrder = typeof args.sortOrder === "number" ? args.sortOrder : 0;
          const published = args.published !== false;

          if (!title || !slug || !summary || !bodyText) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "Missing required fields: title, slug, summary, body" },
            });
          }

          const service = await prisma.service.upsert({
            where: { slug },
            update: { title, summary, body: bodyText, eyebrow, icon, imageUrl, sortOrder, published },
            create: { title, slug, summary, body: bodyText, eyebrow, icon, imageUrl, sortOrder, published },
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Service "${service.title}" successfully created/updated at /services/${service.slug} (ID: ${service.id}). Status: ${service.published ? "Published" : "Draft"}.` }],
            },
          });
        }

        if (toolName === "update_service") {
          const target = String(args.slug || args.id || "").trim();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required to locate the service" } });
          }

          const existing = await prisma.service.findFirst({
            where: { OR: [{ slug: target }, { id: target }] },
          });

          if (!existing) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Service "${target}" not found in database.` },
            });
          }

          const dataToUpdate: Record<string, unknown> = {};
          if (args.title) dataToUpdate.title = String(args.title);
          if (args.newSlug) dataToUpdate.slug = String(args.newSlug).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
          if (args.eyebrow !== undefined) dataToUpdate.eyebrow = String(args.eyebrow);
          if (args.summary) dataToUpdate.summary = String(args.summary);
          if (args.body) dataToUpdate.body = String(args.body);
          if (args.icon) dataToUpdate.icon = String(args.icon);
          if (args.imageUrl) dataToUpdate.imageUrl = String(args.imageUrl);
          if (typeof args.sortOrder === "number") dataToUpdate.sortOrder = args.sortOrder;
          if (typeof args.published === "boolean") dataToUpdate.published = args.published;

          const updated = await prisma.service.update({
            where: { id: existing.id },
            data: dataToUpdate,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Service "${updated.title}" (slug: ${updated.slug}) updated successfully.` }],
            },
          });
        }

        if (toolName === "delete_service") {
          const target = String(args.slug || args.id || "").trim();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required" } });
          }

          const existing = await prisma.service.findFirst({
            where: { OR: [{ slug: target }, { id: target }] },
          });

          if (!existing) {
            const isStatic = staticServices.some((s) => s.slug === target || s.id === target);
            if (isStatic) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: `"${target}" is a built-in static service from code and cannot be deleted from database.` },
              });
            }
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Service "${target}" not found.` },
            });
          }

          await prisma.service.delete({ where: { id: existing.id } });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Service "${existing.title}" (ID: ${existing.id}, slug: ${existing.slug}) permanently deleted.` }],
            },
          });
        }

        // ==========================================
        // 3. PROJECTS CRUD
        // ==========================================
        if (toolName === "list_projects") {
          const featuredOnly = Boolean(args.featuredOnly);
          const category = args.category ? String(args.category).toLowerCase().trim() : undefined;
          const includeDrafts = Boolean(args.includeDrafts);

          const whereClause: { published?: boolean; featured?: boolean } = {};
          if (!includeDrafts) whereClause.published = true;
          if (featuredOnly) whereClause.featured = true;

          let projects: Array<Record<string, unknown>> = [];
          try {
            projects = (await prisma.project.findMany({
              where: whereClause,
              orderBy: { sortOrder: "asc" },
            })) as unknown as Array<Record<string, unknown>>;
          } catch {}

          const fallback = featuredOnly ? staticProjects.filter((p) => p.featured) : staticProjects;
          const finalProjects = projects && projects.length > 0 ? projects : fallback;
          const filtered = category
            ? finalProjects.filter(
                (p) =>
                  String(p.category || "").toLowerCase().includes(category) ||
                  String(p.title || "").toLowerCase().includes(category) ||
                  String(p.summary || "").toLowerCase().includes(category)
              )
            : finalProjects;

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(filtered, null, 2),
                },
              ],
            },
          });
        }

        if (toolName === "get_project") {
          const target = String(args.slug || args.id || "").trim();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required" } });
          }

          let project = await prisma.project.findFirst({
            where: {
              OR: [{ slug: target }, { id: target }],
            },
          });

          if (!project) {
            const staticMatch = staticProjects.find((p) => p.slug === target || p.id === target);
            if (staticMatch) {
              project = {
                ...staticMatch,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as unknown as typeof project;
            }
          }

          if (!project) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Project "${target}" not found` },
            });
          }

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
            },
          });
        }

        if (toolName === "create_project") {
          const title = String(args.title || "").trim();
          const slug = String(args.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
          const summary = String(args.summary || "").trim();
          const bodyText = String(args.body || "").trim();
          const category = String(args.category || "Broadcast Engineering").trim();
          const location = String(args.location || "Nepal").trim();
          const imageUrl = String(args.imageUrl || "/visuals/neon_broadcast_operations_centre.webp");
          const featured = Boolean(args.featured);
          const published = args.published !== false;
          const sortOrder = typeof args.sortOrder === "number" ? args.sortOrder : 0;

          if (!title || !slug || !summary || !bodyText) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "Missing required fields: title, slug, summary, body" },
            });
          }

          const project = await prisma.project.upsert({
            where: { slug },
            update: { title, summary, body: bodyText, category, location, imageUrl, featured, published, sortOrder },
            create: { title, slug, summary, body: bodyText, category, location, imageUrl, featured, published, sortOrder },
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Project "${project.title}" created successfully at /projects/${project.slug} (ID: ${project.id}). Status: ${project.published ? "Published" : "Draft"}.` }],
            },
          });
        }

        if (toolName === "update_project") {
          const target = String(args.slug || args.id || "").trim();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required to locate the project" } });
          }

          const existing = await prisma.project.findFirst({
            where: { OR: [{ slug: target }, { id: target }] },
          });

          if (!existing) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Project "${target}" not found in database.` },
            });
          }

          const dataToUpdate: Record<string, unknown> = {};
          if (args.title) dataToUpdate.title = String(args.title);
          if (args.newSlug) dataToUpdate.slug = String(args.newSlug).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
          if (args.category) dataToUpdate.category = String(args.category);
          if (args.summary) dataToUpdate.summary = String(args.summary);
          if (args.body) dataToUpdate.body = String(args.body);
          if (args.location) dataToUpdate.location = String(args.location);
          if (args.imageUrl) dataToUpdate.imageUrl = String(args.imageUrl);
          if (typeof args.featured === "boolean") dataToUpdate.featured = args.featured;
          if (typeof args.published === "boolean") dataToUpdate.published = args.published;
          if (typeof args.sortOrder === "number") dataToUpdate.sortOrder = args.sortOrder;

          const updated = await prisma.project.update({
            where: { id: existing.id },
            data: dataToUpdate,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Project "${updated.title}" (slug: ${updated.slug}) updated successfully.` }],
            },
          });
        }

        if (toolName === "delete_project") {
          const target = String(args.slug || args.id || "").trim();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required" } });
          }

          const existing = await prisma.project.findFirst({
            where: { OR: [{ slug: target }, { id: target }] },
          });

          if (!existing) {
            const isStatic = staticProjects.some((p) => p.slug === target || p.id === target);
            if (isStatic) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: `"${target}" is a built-in static showcase project from code and cannot be deleted from database.` },
              });
            }
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Project "${target}" not found.` },
            });
          }

          await prisma.project.delete({ where: { id: existing.id } });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Project "${existing.title}" (ID: ${existing.id}, slug: ${existing.slug}) permanently deleted.` }],
            },
          });
        }

        // ==========================================
        // 4. BLOGS / INSIGHTS / ARTICLES CRUD
        // ==========================================
        if (toolName === "list_blog_posts") {
          const category = args.category ? String(args.category).toLowerCase().trim() : undefined;
          const publishedOnly = args.publishedOnly !== false;
          const whereClause: { published?: boolean; category?: string } = {};
          if (publishedOnly) whereClause.published = true;
          if (category) whereClause.category = category;

          let dbPosts: Array<Record<string, unknown>> = [];
          try {
            dbPosts = (await prisma.post.findMany({
              where: whereClause,
              orderBy: { createdAt: "desc" },
              take: 50,
            })) as unknown as Array<Record<string, unknown>>;
          } catch {}

          const staticEditorialPosts = guides.map((g, idx) => ({
            id: `guide-${idx + 1}`,
            slug: g.slug,
            title: g.title,
            category: g.category,
            excerpt: g.excerpt,
            body: g.paragraphs.join("\n\n"),
            imageUrl: g.image,
            published: true,
            createdAt: new Date().toISOString(),
          }));

          const filteredStatic = category
            ? staticEditorialPosts.filter((p) => p.category.toLowerCase().includes(category))
            : staticEditorialPosts;

          // Merge DB posts with static editorial guides
          const allPosts = [
            ...dbPosts,
            ...filteredStatic.filter((s) => !dbPosts.some((d) => d.slug === s.slug)),
          ];

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(allPosts, null, 2) }],
            },
          });
        }

        if (toolName === "get_blog_post") {
          const target = String(args.slug || args.id || "").trim().toLowerCase();
          if (!target) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "slug or id is required" },
            });
          }

          let post: Record<string, unknown> | null = null;
          try {
            post = (await prisma.post.findFirst({
              where: { OR: [{ slug: target }, { id: target }] },
            })) as unknown as Record<string, unknown>;
          } catch {}

          if (!post) {
            const guide = guides.find((g) => g.slug === target);
            if (guide) {
              post = {
                id: `guide-${guide.slug}`,
                slug: guide.slug,
                title: guide.title,
                category: guide.category,
                excerpt: guide.excerpt,
                body: guide.paragraphs.join("\n\n"),
                imageUrl: guide.image,
                published: true,
                createdAt: new Date().toISOString(),
              };
            }
          }

          if (!post) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Blog post or guide '${target}' not found` },
            });
          }

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(post, null, 2) }],
            },
          });
        }

        if (toolName === "create_blog_post") {
          const title = String(args.title || "").trim();
          const slug = String(args.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
          const excerpt = String(args.excerpt || "").trim();
          const bodyText = String(args.body || "").trim();
          const category = String(args.category || "Insights").trim();
          let imageUrl = String(args.imageUrl || "/visuals/futuristic_neon_analytics_control_centre.webp");
          const published = args.published !== false;

          // If base64 image data is provided, save it directly to /uploads/
          if (args.imageBase64 && typeof args.imageBase64 === "string") {
            try {
              let cleanData = args.imageBase64.trim();
              let detectedMime = "image/webp";
              if (cleanData.startsWith("data:")) {
                const semi = cleanData.indexOf(";");
                if (semi !== -1) detectedMime = cleanData.slice(5, semi);
                const comma = cleanData.indexOf(",");
                if (comma !== -1) cleanData = cleanData.slice(comma + 1);
              }
              const buf = Buffer.from(cleanData, "base64");
              const saved = await saveImageBuffer({
                buffer: buf,
                originalFilename: typeof args.imageFilename === "string" ? args.imageFilename : `${slug}.webp`,
                mimeType: detectedMime,
                alt: typeof args.imageAlt === "string" ? args.imageAlt : title,
              });
              imageUrl = saved.path;
            } catch (err) {
              console.warn("[create_blog_post imageBase64 save error]", err);
            }
          }

          if (!title || !slug || !excerpt || !bodyText) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "Missing required fields: title, slug, excerpt, body" },
            });
          }

          const post = await prisma.post.upsert({
            where: { slug },
            update: {
              title,
              excerpt,
              body: bodyText,
              category,
              imageUrl,
              published,
              publishedAt: published ? new Date() : null,
            },
            create: {
              title,
              slug,
              excerpt,
              body: bodyText,
              category,
              imageUrl,
              published,
              publishedAt: published ? new Date() : null,
            },
          });

          await logAudit({
            action: "POST_CREATED",
            category: "INSIGHTS",
            actor: auth.identity || "MCP Client",
            target: `/insights/${post.slug}`,
            details: `Insight "${post.title}" saved. Image: ${imageUrl}`,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Successfully saved blog post "${post.title}" (slug: /insights/${post.slug}, ID: ${post.id}, Cover: ${post.imageUrl}). Status: ${post.published ? "Published" : "Draft"}.`,
                },
              ],
            },
          });
        }

        if (toolName === "update_blog_post") {
          const target = String(args.slug || args.id || "").trim();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required" } });
          }

          const existing = await prisma.post.findFirst({
            where: { OR: [{ slug: target }, { id: target }] },
          });

          if (!existing) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: `Post "${target}" not found in database.` } });
          }

          const dataToUpdate: Record<string, unknown> = {};
          if (args.title) dataToUpdate.title = String(args.title);
          if (args.newSlug) dataToUpdate.slug = String(args.newSlug).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
          if (args.excerpt) dataToUpdate.excerpt = String(args.excerpt);
          if (args.body) dataToUpdate.body = String(args.body);
          if (args.category) dataToUpdate.category = String(args.category);

          // Handle image upload in update
          if (args.imageBase64 && typeof args.imageBase64 === "string") {
            try {
              let cleanData = args.imageBase64.trim();
              let detectedMime = "image/webp";
              if (cleanData.startsWith("data:")) {
                const semi = cleanData.indexOf(";");
                if (semi !== -1) detectedMime = cleanData.slice(5, semi);
                const comma = cleanData.indexOf(",");
                if (comma !== -1) cleanData = cleanData.slice(comma + 1);
              }
              const buf = Buffer.from(cleanData, "base64");
              const saved = await saveImageBuffer({
                buffer: buf,
                originalFilename: typeof args.imageFilename === "string" ? args.imageFilename : `${existing.slug}.webp`,
                mimeType: detectedMime,
                alt: String(args.title || existing.title),
              });
              dataToUpdate.imageUrl = saved.path;
            } catch (err) {
              console.warn("[update_blog_post imageBase64 save error]", err);
            }
          } else if (args.imageUrl) {
            dataToUpdate.imageUrl = String(args.imageUrl);
          }

          if (typeof args.published === "boolean") {
            dataToUpdate.published = args.published;
            if (args.published) dataToUpdate.publishedAt = new Date();
          }

          const updated = await prisma.post.update({
            where: { id: existing.id },
            data: dataToUpdate,
          });

          await logAudit({
            action: "POST_UPDATED",
            category: "INSIGHTS",
            actor: auth.identity || "MCP Client",
            target: `/insights/${updated.slug}`,
            details: `Insight "${updated.title}" updated. Image: ${updated.imageUrl}`,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Post "${updated.title}" (slug: /insights/${updated.slug}, Cover: ${updated.imageUrl}) updated successfully.` }],
            },
          });
        }

        if (toolName === "delete_blog_post") {
          const target = String(args.slug || args.id || "").trim().toLowerCase();
          if (!target) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "slug or id is required" } });
          }

          const existing = await prisma.post.findFirst({
            where: { OR: [{ slug: target }, { id: target }] },
          });

          if (!existing) {
            const isGuide = guides.some((g) => g.slug === target);
            if (isGuide) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: `"${target}" is a built-in static editorial guide and cannot be deleted from database.` },
              });
            }
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Blog post "${target}" not found.` },
            });
          }

          await prisma.post.delete({ where: { id: existing.id } });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Blog post "${existing.title}" (slug: /insights/${existing.slug}, ID: ${existing.id}) permanently deleted.` }],
            },
          });
        }

        // ==========================================
        // 5. CONTACT INQUIRIES & LEADS
        // ==========================================
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
              internalNotes: `Submitted via MCP Client: ${auth.identity || "Anonymous Client"}`,
            },
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Inquiry successfully logged with ID #${inquiry.id}. The Simulcast engineering team has been notified.`,
                },
              ],
            },
          });
        }

        if (toolName === "list_inquiries") {
          const status = args.status ? String(args.status).toUpperCase().trim() : undefined;
          const limit = typeof args.limit === "number" ? Math.min(Math.max(1, args.limit), 100) : 25;
          const whereClause: { status?: "NEW" | "IN_PROGRESS" | "RESPONDED" | "CLOSED" } = {};
          if (status && status !== "ALL") {
            if (["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED"].includes(status)) {
              whereClause.status = status as "NEW" | "IN_PROGRESS" | "RESPONDED" | "CLOSED";
            }
          }

          const inquiries = await prisma.inquiry.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: limit,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(inquiries, null, 2) }],
            },
          });
        }

        if (toolName === "get_inquiry") {
          const inquiryId = String(args.id || "").trim();
          if (!inquiryId) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "id is required" } });
          }

          const inquiry = await prisma.inquiry.findUnique({
            where: { id: inquiryId },
          });

          if (!inquiry) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: `Inquiry #${inquiryId} not found` } });
          }

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(inquiry, null, 2) }],
            },
          });
        }

        if (toolName === "update_inquiry") {
          const inquiryId = String(args.id || "").trim();
          if (!inquiryId) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "id is required" } });
          }

          const dataToUpdate: { status?: "NEW" | "IN_PROGRESS" | "RESPONDED" | "CLOSED"; internalNotes?: string } = {};
          if (args.status) {
            const st = String(args.status).toUpperCase().trim();
            if (["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED"].includes(st)) {
              dataToUpdate.status = st as "NEW" | "IN_PROGRESS" | "RESPONDED" | "CLOSED";
            }
          }
          if (typeof args.internalNotes === "string") {
            dataToUpdate.internalNotes = args.internalNotes;
          }

          const updated = await prisma.inquiry.update({
            where: { id: inquiryId },
            data: dataToUpdate,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Inquiry #${updated.id} from ${updated.name} updated successfully. Status: ${updated.status}.` }],
            },
          });
        }

        if (toolName === "delete_inquiry") {
          const inquiryId = String(args.id || "").trim();
          if (!inquiryId) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "id is required" } });
          }

          await prisma.inquiry.delete({
            where: { id: inquiryId },
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Inquiry #${inquiryId} permanently deleted.` }],
            },
          });
        }

        // ==========================================
        // 6. SIMULCAST LIVE CHAT SYSTEM
        // ==========================================
        if (toolName === "list_chat_sessions") {
          const status = args.status ? String(args.status).toUpperCase().trim() : undefined;
          const limit = typeof args.limit === "number" ? Math.min(Math.max(1, args.limit), 100) : 25;
          const whereClause: { status?: "ACTIVE" | "ESCALATED_HUMAN" | "CLOSED" } = {};
          if (status && status !== "ALL") {
            if (["ACTIVE", "ESCALATED_HUMAN", "CLOSED"].includes(status)) {
              whereClause.status = status as "ACTIVE" | "ESCALATED_HUMAN" | "CLOSED";
            }
          }

          const sessions = await prisma.chatSession.findMany({
            where: whereClause,
            include: {
              messages: {
                take: 1,
                orderBy: { createdAt: "desc" },
              },
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
          });

          const summaryList = sessions.map((s) => ({
            id: s.id,
            visitorId: s.visitorId,
            visitorName: s.visitorName,
            visitorEmail: s.visitorEmail,
            visitorPhone: s.visitorPhone,
            status: s.status,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            escalatedAt: s.escalatedAt,
            closedAt: s.closedAt,
            summary: s.summary,
            latestMessage: s.messages[0]
              ? {
                  sender: s.messages[0].sender,
                  senderName: s.messages[0].senderName,
                  content: s.messages[0].content,
                  createdAt: s.messages[0].createdAt,
                }
              : null,
          }));

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(summaryList, null, 2) }],
            },
          });
        }

        if (toolName === "get_chat_history") {
          const sessionId = String(args.sessionId || "").trim();
          if (!sessionId) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "sessionId is required" } });
          }

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

        if (toolName === "send_chat_message") {
          const sessionId = String(args.sessionId || "").trim();
          const content = String(args.content || "").trim();
          const sender = String(args.sender || "human_agent").trim();
          const senderName = String(args.senderName || "Simulcast Support Representative").trim();

          if (!sessionId || !content) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "sessionId and content are required" },
            });
          }

          const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
          });

          if (!session) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Chat session #${sessionId} not found.` },
            });
          }

          const msg = await prisma.chatMessage.create({
            data: {
              sessionId,
              sender,
              senderName,
              content,
            },
          });

          await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
              status: session.status === "CLOSED" ? "ACTIVE" : session.status,
              updatedAt: new Date(),
            },
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Message successfully posted to session #${sessionId} for ${session.visitorName} (sender: ${senderName}, ID: ${msg.id}):\n"${content}"`,
                },
              ],
            },
          });
        }

        if (toolName === "update_chat_session") {
          const sessionId = String(args.sessionId || "").trim();
          if (!sessionId) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "sessionId is required" } });
          }

          const dataToUpdate: Record<string, unknown> = {};
          if (args.status) {
            const st = String(args.status).toUpperCase().trim();
            if (["ACTIVE", "ESCALATED_HUMAN", "CLOSED"].includes(st)) {
              dataToUpdate.status = st;
              if (st === "CLOSED") dataToUpdate.closedAt = new Date();
              if (st === "ESCALATED_HUMAN") dataToUpdate.escalatedAt = new Date();
            }
          }
          if (typeof args.visitorName === "string") dataToUpdate.visitorName = args.visitorName;
          if (typeof args.visitorEmail === "string") dataToUpdate.visitorEmail = args.visitorEmail;
          if (typeof args.visitorPhone === "string") dataToUpdate.visitorPhone = args.visitorPhone;
          if (typeof args.summary === "string") dataToUpdate.summary = args.summary;

          const updated = await prisma.chatSession.update({
            where: { id: sessionId },
            data: dataToUpdate,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Chat session #${updated.id} updated. Status: ${updated.status}.` }],
            },
          });
        }

        if (toolName === "close_chat_session") {
          const sessionId = String(args.sessionId || "").trim();
          const sendTranscript = Boolean(args.sendTranscriptEmail);
          const summary = typeof args.summary === "string" ? args.summary : undefined;

          if (!sessionId) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: "sessionId is required" } });
          }

          const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          });

          if (!session) {
            return NextResponse.json({ jsonrpc, id, error: { code: -32602, message: `Chat session #${sessionId} not found.` } });
          }

          await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
              status: "CLOSED",
              closedAt: new Date(),
              summary: summary || session.summary,
              transcriptSent: sendTranscript ? true : session.transcriptSent,
            },
          });

          let emailStatus = "Not requested";
          if (sendTranscript) {
            try {
              await sendChatTranscriptEmail({
                sessionId: session.id,
                visitorName: session.visitorName,
                visitorEmail: session.visitorEmail,
                messages: session.messages,
              });
              emailStatus = "Transcript email dispatched to support team";
            } catch (err: unknown) {
              emailStatus = `Transcript email failed: ${err instanceof Error ? err.message : String(err)}`;
            }
          }

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Chat session #${session.id} for "${session.visitorName}" closed successfully. Email delivery: ${emailStatus}.`,
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

        // ==========================================
        // 7. AI ENGINE
        // ==========================================
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

        // ==========================================
        // 8. MEDIA & IMAGE ASSET MANAGEMENT
        // ==========================================
        if (toolName === "upload_media_image") {
          let buffer: Buffer | null = null;
          let filename = typeof args.filename === "string" ? args.filename.trim() : "";
          let mimeType = typeof args.mimeType === "string" ? args.mimeType.trim() : "";
          const alt = typeof args.alt === "string" ? args.alt.trim() : "";

          // Option A: Base64 data string
          if (args.data && typeof args.data === "string") {
            let clean = args.data.trim();
            if (clean.startsWith("data:")) {
              const semi = clean.indexOf(";");
              if (semi !== -1 && !mimeType) mimeType = clean.slice(5, semi);
              const comma = clean.indexOf(",");
              if (comma !== -1) clean = clean.slice(comma + 1);
            }
            buffer = Buffer.from(clean, "base64");
          } else if (args.url && typeof args.url === "string") {
            // Option B: Download from remote URL
            const res = await fetch(args.url.trim());
            if (!res.ok) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: `Failed to download image from ${args.url}: HTTP ${res.status}` },
              });
            }
            const arrayBuf = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuf);
            if (!mimeType) {
              const ct = res.headers.get("content-type");
              if (ct && ct.startsWith("image/")) mimeType = ct;
            }
            if (!filename) {
              try {
                const parsedUrl = new URL(args.url);
                filename = path.basename(parsedUrl.pathname) || "downloaded-image.webp";
              } catch {
                filename = "downloaded-image.webp";
              }
            }
          }

          if (!buffer || buffer.length === 0) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "Either 'data' (base64 string) or 'url' (image link) must be provided." },
            });
          }

          if (!filename) filename = `image_${Date.now()}.webp`;

          const saved = await saveImageBuffer({
            buffer,
            originalFilename: filename,
            mimeType: mimeType || undefined,
            alt,
          });

          await logAudit({
            action: "MEDIA_UPLOADED",
            category: "MEDIA",
            actor: auth.identity || "MCP Client",
            target: saved.path,
            details: `Uploaded ${saved.filename} (${Math.round(saved.size / 1024)} KB) via MCP`,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      url: saved.path,
                      filename: saved.filename,
                      sizeBytes: saved.size,
                      sizeKb: Math.round(saved.size / 1024),
                      mimeType: saved.mimeType,
                      alt,
                      message: `Image successfully uploaded to ${saved.path}. You can use this URL for blog posts, services, or hero images.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          });
        }

        if (toolName === "list_media_assets") {
          const limit = typeof args.limit === "number" ? Math.min(Math.max(1, args.limit), 100) : 50;
          let assets: Array<Record<string, unknown>> = [];
          try {
            assets = (await prisma.mediaAsset.findMany({
              orderBy: { createdAt: "desc" },
              take: limit,
            })) as unknown as Array<Record<string, unknown>>;
          } catch {}

          const bundledVisuals = [
            { path: "/visuals/neon_himalayan_broadcast_control_room.webp", filename: "Broadcast Control Room", mimeType: "image/webp" },
            { path: "/visuals/neon_broadcast_operations_centre.webp", filename: "Operations Centre", mimeType: "image/webp" },
            { path: "/visuals/futuristic_neon_analytics_control_centre.webp", filename: "Analytics & Monitoring", mimeType: "image/webp" },
            { path: "/visuals/futuristic_purple_analytics_dashboard_ecosystem.webp", filename: "Ecosystem Dashboard", mimeType: "image/webp" },
          ];

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ uploadedAssets: assets, bundledVisuals }, null, 2),
                },
              ],
            },
          });
        }

        // ==========================================
        // 9. EMAIL DISPATCH & QUEUE SYSTEM
        // ==========================================
        if (toolName === "send_email") {
          const to = args.to;
          const subject = String(args.subject || "").trim();
          const html = String(args.html || "").trim();
          const text = typeof args.text === "string" ? args.text : undefined;
          const cc = args.cc as string | string[] | undefined;
          const bcc = args.bcc as string | string[] | undefined;
          const attachments = (args.attachments || []) as EmailAttachment[];
          const shouldQueue = Boolean(args.queue) || (Array.isArray(to) && to.length > 3);
          const priority = typeof args.priority === "number" ? args.priority : 0;

          if (!to || !subject || !html) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "'to', 'subject', and 'html' are required fields." },
            });
          }

          if (shouldQueue) {
            const queuedItem = await enqueueEmail({
              to: to as string | string[],
              cc,
              bcc,
              subject,
              html,
              text,
              attachments,
              priority,
              source: "MCP",
              clientIdentity: auth.identity || "MCP Client",
            });

            await logAudit({
              action: "EMAIL_QUEUED",
              category: "EMAIL",
              actor: auth.identity || "MCP Client",
              target: String(queuedItem.to),
              details: `Queued email #${queuedItem.id} with subject "${subject}" (priority: ${priority})`,
            });

            return NextResponse.json({
              jsonrpc,
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      {
                        status: "QUEUED",
                        queueItemId: queuedItem.id,
                        to: queuedItem.to,
                        subject: queuedItem.subject,
                        priority: queuedItem.priority,
                        scheduledAt: queuedItem.scheduledAt,
                        message: `Email added to Simulcast delivery queue (ID: ${queuedItem.id}). Will be processed by queue worker.`,
                      },
                      null,
                      2
                    ),
                  },
                ],
              },
            });
          } else {
            // Direct Immediate Send
            const sendRes = await sendEmail({
              to: to as string | string[],
              cc,
              bcc,
              subject,
              html,
              text,
              attachments,
            });

            await recordEmailLog({
              to: Array.isArray(to) ? to.join(", ") : String(to),
              subject,
              status: sendRes.ok ? "SENT" : "FAILED",
              source: "MCP",
              messageId: sendRes.messageId,
              error: sendRes.error,
              hasAttachments: attachments.length > 0,
              attachmentNames: attachments.map((a) => a.filename).join(", "),
              clientIdentity: auth.identity || "MCP Client",
            });

            await logAudit({
              action: "EMAIL_DIRECT_SENT",
              category: "EMAIL",
              actor: auth.identity || "MCP Client",
              target: Array.isArray(to) ? to.join(", ") : String(to),
              details: `Immediate send subject "${subject}". Status: ${sendRes.ok ? "SUCCESS" : "FAILED"}`,
              status: sendRes.ok ? "SUCCESS" : "FAILED",
            });

            if (!sendRes.ok) {
              return NextResponse.json({
                jsonrpc,
                id,
                result: {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(
                        {
                          status: "FAILED",
                          error: sendRes.error,
                          message: "Email sending failed; log recorded in system.",
                        },
                        null,
                        2
                      ),
                    },
                  ],
                },
              });
            }

            return NextResponse.json({
              jsonrpc,
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      {
                        status: "SENT",
                        messageId: sendRes.messageId,
                        to,
                        subject,
                        message: `Email successfully dispatched via SMTP (Message-ID: ${sendRes.messageId}).`,
                      },
                      null,
                      2
                    ),
                  },
                ],
              },
            });
          }
        }

        if (toolName === "send_bulk_emails") {
          const recipients = args.recipients as Array<string | { email: string; name?: string; vars?: Record<string, string> }>;
          const subject = String(args.subject || "").trim();
          const html = String(args.html || "").trim();
          const text = typeof args.text === "string" ? args.text : undefined;
          const attachments = (args.attachments || []) as EmailAttachment[];
          const batchName = typeof args.batchName === "string" ? args.batchName.trim() : undefined;
          const priority = typeof args.priority === "number" ? args.priority : 0;

          if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "'recipients' must be a non-empty array of email addresses or objects." },
            });
          }

          if (!subject || !html) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "'subject' and 'html' are required." },
            });
          }

          const bulkResult = await enqueueBulkEmails({
            recipients,
            subject,
            html,
            text,
            attachments,
            batchName,
            source: "MCP",
            clientIdentity: auth.identity || "MCP Client",
            priority,
          });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      ...bulkResult,
                      message: `Successfully enqueued ${bulkResult.totalQueued} emails into the queue under batch '${bulkResult.batchId}'. View and process them via MCP or Admin Panel at /admin/email.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          });
        }

        if (toolName === "get_email_queue_status") {
          const status = typeof args.status === "string" ? args.status : undefined;
          const batchId = typeof args.batchId === "string" ? args.batchId : undefined;
          const limit = typeof args.limit === "number" ? args.limit : 25;

          const queueData = await getEmailQueue({ status, batchId, limit });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(queueData, null, 2) }],
            },
          });
        }

        if (toolName === "process_email_queue") {
          const batchSize = typeof args.batchSize === "number" ? Math.min(Math.max(1, args.batchSize), 100) : 25;
          const processResult = await processEmailQueue(batchSize);

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      summary: `Processed ${processResult.processed} queue items: ${processResult.sent} sent, ${processResult.failed} failed.`,
                      details: processResult,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          });
        }

        if (toolName === "get_email_logs") {
          const status = typeof args.status === "string" ? args.status : undefined;
          const search = typeof args.search === "string" ? args.search : undefined;
          const limit = typeof args.limit === "number" ? args.limit : 50;

          const logs = await getEmailLogs({ status, search, limit });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(logs, null, 2) }],
            },
          });
        }

        if (toolName === "retry_failed_emails") {
          const targetId = typeof args.id === "string" ? args.id.trim() : undefined;
          const res = await retryFailedEmails(targetId);

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Reset ${res.retried} failed emails back to PENDING status.` }],
            },
          });
        }

        if (toolName === "clear_email_queue") {
          const status = typeof args.status === "string" ? (args.status as "SENT" | "FAILED" | "ALL") : "ALL";
          const res = await clearEmailQueue(status);

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Cleared ${res.cleared} items from email queue.` }],
            },
          });
        }

        if (toolName === "get_audit_logs") {
          const category = typeof args.category === "string" ? args.category : undefined;
          const search = typeof args.search === "string" ? args.search : undefined;
          const limit = typeof args.limit === "number" ? args.limit : 50;

          const logs = await getAuditLogs({ category, search, limit });

          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(logs, null, 2) }],
            },
          });
        }


        // ==========================================
        // 12. DYNAMIC CUSTOM MCP TOOLS (ADMIN CONFIGURABLE)
        // ==========================================
        const customRes = await executeCustomMcpTool(toolName || "", args, auth.identity || "MCP Client");
        if (customRes.ok || (customRes.error && !customRes.error.includes("not found or is currently disabled"))) {
          if (!customRes.ok) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32000, message: customRes.error || "Custom tool execution failed." },
            });
          }
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: typeof customRes.result === "string" ? customRes.result : JSON.stringify(customRes.result, null, 2),
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-key, x-api-key",
    },
  });
}
