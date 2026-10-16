import { NextResponse } from "next/server";
import { verifyMcpAuth } from "@/lib/mcp-auth";
import { sendEmail, type EmailAttachment } from "@/lib/email";
import { enqueueEmail, logEmailDelivery } from "@/lib/email-queue";
import { logAudit } from "@/lib/audit";
import { recordMcpActivity } from "@/lib/mcp-manager";

export const dynamic = "force-dynamic";

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
    const to = body.to || body.recipient || body.email;
    const subject = body.subject || "Message from Simulcast Technologies";
    let html = body.html || body.message || body.body || "";
    const text = body.text || undefined;
    const cc = body.cc || undefined;
    const bcc = body.bcc || undefined;
    const attachments = (body.attachments || []) as EmailAttachment[];
    const queue = Boolean(body.queue);

    if (!to) {
      return NextResponse.json({ error: "'to' recipient email is required." }, { status: 400 });
    }

    // Wrap plain text in standard Simulcast branded email container if not HTML
    if (html && !html.includes("<") && !html.includes(">")) {
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #eae4eb; border-radius: 8px; color: #2b0d3a;">
          <div style="border-bottom: 2px solid #e11d72; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2b0d3a;">Simulcast Technologies</h2>
            <p style="margin: 4px 0 0; color: #7b6f84; font-size: 13px;">Pioneer IT & Broadcast Infrastructure in Nepal</p>
          </div>
          <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${html}</div>
          <div style="border-top: 1px solid #eae4eb; margin-top: 30px; padding-top: 14px; font-size: 12px; color: #7b6f84;">
            <p style="margin: 0;"><strong>Simulcast Technologies Pvt. Ltd.</strong></p>
            <p style="margin: 2px 0;">Kathmandu, Nepal | support@simulcast.com.np | https://www.simulcast.com.np</p>
          </div>
        </div>
      `;
    }

    if (queue) {
      const qItem = await enqueueEmail({
        to,
        cc,
        bcc,
        subject,
        html,
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
          message: `Email to ${Array.isArray(to) ? to.join(", ") : to} placed in Simulcast queue.`,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Direct immediate dispatch from support@simulcast.com.np
    const sendRes = await sendEmail({
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      attachments,
    });

    await logEmailDelivery({
      to: Array.isArray(to) ? to.join(", ") : to,
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
      target: Array.isArray(to) ? to.join(", ") : to,
      details: `Subject: ${subject} (Status: ${sendRes.ok ? "SENT" : "FAILED"})`,
      status: sendRes.ok ? "SUCCESS" : "FAILED",
    });

    if (!sendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: sendRes.error || "Failed to send email via Simulcast SMTP.",
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
        to,
        subject,
        messageId: sendRes.messageId,
        message: `Email successfully delivered from support@simulcast.com.np to ${Array.isArray(to) ? to.join(", ") : to}`,
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
