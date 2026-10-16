import { NextResponse } from "next/server";
import { verifyMcpAuth } from "@/lib/mcp-auth";
import { sendEmail, type EmailAttachment, formatSimulcastEmail } from "@/lib/email";
import { enqueueEmail, enqueueBulkEmails, logEmailDelivery } from "@/lib/email-queue";
import { logAudit } from "@/lib/audit";
import { recordMcpActivity } from "@/lib/mcp-manager";

export const dynamic = "force-dynamic";

function generateCompanyProfileHtml(vars: Record<string, string> = {}): string {
  const name = vars.name || "Valued Partner";
  return `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for reaching out to <strong>Simulcast Technologies Pvt. Ltd.</strong> Below is our official company profile and product solution catalog:</p>
    
    <div style="background: #faf7fb; border-left: 4px solid #2b0d3a; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
      <h3 style="margin: 0 0 8px; color: #2b0d3a; font-size: 16px;">About Simulcast Technologies</h3>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4a3e52;">
        Simulcast Technologies is a leading telecommunications and broadcast engineering company based in Kathmandu, Nepal. We deliver mission-critical infrastructure across 7 provinces, powering national FM networks, digital television broadcasting, fiber backbones, and enterprise software.
      </p>
    </div>

    <h3 style="color: #2b0d3a; font-size: 16px; border-bottom: 1px solid #eae4eb; padding-bottom: 8px; margin-top: 24px;">
      Specialized Solutions & SIMUL Product Suite
    </h3>

    <ul style="font-size: 13px; line-height: 1.8; color: #4a3e52; padding-left: 20px;">
      <li><strong>RF & Digital Broadcasting:</strong> DVB-T2 / ISDB-T digital TV transmitters, high-power FM systems, STL links, antenna design, and combiner arrays.</li>
      <li><strong>IPTV & Cloud Playout:</strong> 24/7 master control playout automation, multi-bitrate live transcoding, catch-up TV, and OTT streaming platforms.</li>
      <li><strong>Optical Fiber Networks & ISP:</strong> DWDM/CWDM optical transport, carrier-grade GPON/XGS-PON OLTs, BGP core routing, CGNAT, and TR-069 ACS remote provisioning.</li>
      <li><strong>SIMUL Software Suite:</strong> Enterprise billing engines, subscriber management systems, fiber splitter GIS mapping, and bandwidth accounting.</li>
      <li><strong>AI & Autonomous Agents:</strong> Model Context Protocol (MCP) server integration, automated customer intelligence, and CRM workflow automation.</li>
    </ul>

    <div style="background: #2b0d3a; color: #ffffff; padding: 18px; border-radius: 6px; margin-top: 24px;">
      <h4 style="margin: 0 0 6px; color: #ffffff; font-size: 15px;">Official Contact Channels</h4>
      <p style="margin: 0; font-size: 13px; color: #e4d8ec; line-height: 1.6;">
        📍 Kathmandu, Bagmati Province, Nepal<br/>
        ✉️ <strong>Official Support:</strong> support@simulcast.com.np | info@simulcast.com.np<br/>
        🌐 <strong>Website:</strong> https://www.simulcast.com.np
      </p>
    </div>
  `;
}

export async function POST(request: Request) {
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "MCP-Client";

  // Verify auth
  const auth = await verifyMcpAuth(request, "send_email");
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Authentication required to send email." },
      {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-key, x-api-key",
        },
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawTo = body.to || body.recipient || body.email;
    const recipientsList = body.recipients; // For dynamic bulk
    let subject = body.subject || "";
    let html = body.html || body.message || body.body || "";
    const text = body.text || undefined;
    const cc = body.cc || undefined;
    const bcc = body.bcc || undefined;
    const attachments = (body.attachments || []) as EmailAttachment[];
    const queue = Boolean(body.queue);
    const templateType = String(body.templateType || body.template || "").toUpperCase();
    const variables: Record<string, string> = body.variables || body.vars || {};

    // 1. Dynamic Bulk Dispatch if recipients array provided
    if (Array.isArray(recipientsList) && recipientsList.length > 0) {
      if (!subject) subject = "Update from Simulcast Technologies";
      if (!html) html = "<p>Hello {{name}}, you have a notification from Simulcast.</p>";

      const bulkRes = await enqueueBulkEmails({
        recipients: recipientsList,
        subject,
        html,
        text,
        attachments,
        batchName: body.batchName || body.batchId || "chatgpt_bulk",
        source: "CHATGPT_ACTION",
        clientIdentity: auth.identity,
        priority: typeof body.priority === "number" ? body.priority : 0,
      });

      return NextResponse.json(
        {
          success: true,
          status: "QUEUED",
          batchId: bulkRes.batchId,
          totalQueued: bulkRes.totalQueued,
          message: `Successfully queued ${bulkRes.totalQueued} emails with dynamic personalized fields.`,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    if (!rawTo) {
      return NextResponse.json({ error: "'to' recipient email is required." }, { status: 400 });
    }

    // 2. Handle template presets if specified
    if (templateType === "COMPANY_PROFILE") {
      if (!subject) subject = "Simulcast Technologies Pvt. Ltd. — Company Profile, Products & Solutions";
      if (!html) html = generateCompanyProfileHtml(variables);
    } else if (!subject) {
      subject = "Message from Simulcast Technologies";
    }

    // 3. Interpolate dynamic variables into subject and html
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, String(val ?? ""));
      html = html.replace(regex, String(val ?? ""));
    }

    // Format html into responsive Simulcast layout
    const formattedHtml = formatSimulcastEmail(html);

    // 4. Background queue or immediate dispatch
    if (queue || (Array.isArray(rawTo) && rawTo.length > 3)) {
      const qItem = await enqueueEmail({
        to: rawTo,
        cc,
        bcc,
        subject,
        html: formattedHtml,
        text,
        attachments,
        source: "CHATGPT_ACTION",
        clientIdentity: auth.identity,
      });

      return NextResponse.json(
        {
          success: true,
          status: "QUEUED",
          queueId: qItem.id,
          message: `Email to ${Array.isArray(rawTo) ? rawTo.join(", ") : rawTo} placed into background queue.`,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Immediate dispatch via SMTP
    const sendRes = await sendEmail({
      to: rawTo,
      cc,
      bcc,
      subject,
      html: formattedHtml,
      text,
      attachments,
      variables,
    });

    await logEmailDelivery({
      to: Array.isArray(rawTo) ? rawTo.join(", ") : rawTo,
      subject,
      status: sendRes.ok ? "SENT" : "FAILED",
      source: "CHATGPT_ACTION",
      messageId: sendRes.messageId || null,
      error: sendRes.error || null,
      hasAttachments: attachments.length > 0,
      clientIdentity: auth.identity,
    });

    await recordMcpActivity({
      tokenOrIdentity: auth.identity || "ChatGPT Client",
      toolName: "send_email",
      ipAddress,
      userAgent,
    });

    await logAudit({
      action: "EMAIL_SENT_CHATGPT",
      category: "EMAIL",
      actor: auth.identity || "ChatGPT Action",
      target: Array.isArray(rawTo) ? rawTo.join(", ") : rawTo,
      details: `Subject: ${subject} (Status: ${sendRes.ok ? "SENT" : "FAILED"})`,
      status: sendRes.ok ? "SUCCESS" : "FAILED",
    });

    if (!sendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: sendRes.error || "Failed sending email via Simulcast SMTP.",
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: "SENT",
        from: "support@simulcast.com.np",
        to: rawTo,
        subject,
        messageId: sendRes.messageId,
        message: `Email successfully delivered from support@simulcast.com.np to ${Array.isArray(rawTo) ? rawTo.join(", ") : rawTo}`,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error sending email";
    return NextResponse.json(
      { success: false, error: errorMsg },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-key, x-api-key",
    },
  });
}
