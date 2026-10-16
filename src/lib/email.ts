import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "mail.simulcast.com.np";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const emailUser = process.env.EMAIL_USER || "support@simulcast.com.np";
const emailPass = process.env.EMAIL_PASS || "support@simulcast";
const emailFrom = process.env.EMAIL_FROM || "Simulcast Support <support@simulcast.com.np>";
const defaultEscalation = (process.env.ESCALATION_EMAILS || "info@simulcast.com.np,support@simulcast.com.np")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const supportEmail = process.env.SUPPORT_EMAIL || "support@simulcast.com.np";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  url?: string;
  contentType?: string;
  cid?: string;
  encoding?: string;
}

export function formatSimulcastEmail(content: string, title?: string): string {
  // If already full HTML, return as-is
  if (content.includes("<html") || content.includes("<!DOCTYPE") || (content.includes("<div") && content.includes("font-family"))) {
    return content;
  }

  // Convert basic markdown formatting into HTML
  let formatted = content
    .replace(/^### (.*$)/gim, '<h3 style="color:#2b0d3a;margin:16px 0 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#2b0d3a;margin:20px 0 10px;border-bottom:1px solid #eae4eb;padding-bottom:6px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#2b0d3a;margin:24px 0 12px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#2b0d3a;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" style="color:#e11d72;text-decoration:none;font-weight:600;">$1</a>')
    .replace(/\n\n/gim, '</p><p style="margin:12px 0;line-height:1.6;font-size:14px;color:#3e3346;">')
    .replace(/\n- (.*$)/gim, '<li style="margin:4px 0;line-height:1.5;">$1</li>');

  if (formatted.includes("<li>")) {
    formatted = formatted.replace(/(<li.*<\/li>)/gms, '<ul style="padding-left:20px;margin:12px 0;">$1</ul>');
  }

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;padding:28px 24px;border:1px solid #eae4eb;border-radius:10px;background:#ffffff;color:#2b0d3a;">
      <div style="border-bottom:3px solid #e11d72;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2 style="margin:0;color:#2b0d3a;font-size:22px;letter-spacing:-0.5px;">Simulcast Technologies</h2>
          <p style="margin:4px 0 0;color:#e11d72;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Engineering Critical IT, Broadcast & Telecom Infrastructure</p>
        </div>
      </div>
      ${title ? `<h3 style="color:#2b0d3a;font-size:18px;margin-top:0;">${title}</h3>` : ""}
      <div style="font-size:14px;line-height:1.6;color:#3e3346;">
        <p style="margin:0 0 12px;line-height:1.6;font-size:14px;color:#3e3346;">${formatted}</p>
      </div>
      <div style="border-top:1px solid #eae4eb;margin-top:32px;padding-top:16px;font-size:12px;color:#7b6f84;line-height:1.5;">
        <p style="margin:0;"><strong>Simulcast Technologies Pvt. Ltd.</strong></p>
        <p style="margin:2px 0;">Kathmandu, Nepal | ✉️ <a href="mailto:support@simulcast.com.np" style="color:#e11d72;">support@simulcast.com.np</a> | 🌐 <a href="https://www.simulcast.com.np" style="color:#e11d72;">www.simulcast.com.np</a></p>
      </div>
    </div>
  `;
}

export async function sendEmail({
  from,
  fromAccount,
  to,
  cc,
  bcc,
  subject,
  html,
  text,
  attachments,
  attachment,
  attachCompanyProfile,
  variables,
}: {
  from?: string;
  fromAccount?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  attachment?: string | EmailAttachment;
  attachCompanyProfile?: boolean;
  variables?: Record<string, string>;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const chosenAccount = (fromAccount || from || "").toLowerCase().trim();
  let senderName = "Simulcast Support NOC";
  let senderEmail = emailUser;
  let finalFrom = emailFrom;

  if (chosenAccount.includes("info")) {
    senderName = "Simulcast Official Info";
    senderEmail = "info@simulcast.com.np";
    finalFrom = `"${senderName}" <${senderEmail}>`;
  } else if (chosenAccount.includes("sales")) {
    senderName = "Sales & Enterprise Solutions";
    senderEmail = "sales@simulcast.com.np";
    finalFrom = `"${senderName}" <${senderEmail}>`;
  } else if (chosenAccount.includes("kalyan")) {
    senderName = "Kalyan Karn (Lead Engineering)";
    senderEmail = "kalyan@simulcast.com.np";
    finalFrom = `"${senderName}" <${senderEmail}>`;
  } else if (chosenAccount && chosenAccount.includes("@")) {
    senderEmail = chosenAccount;
    senderName = chosenAccount.split("@")[0].toUpperCase();
    finalFrom = `"${senderName}" <${senderEmail}>`;
  }

  const recipientList = Array.isArray(to) ? to.join(", ") : to;
  const ccList = cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined;
  const bccList = bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined;

  // Apply dynamic variables if provided
  let finalSubject = subject;
  let finalHtml = html;
  if (variables && typeof variables === "object") {
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      finalSubject = finalSubject.replace(regex, String(val ?? ""));
      finalHtml = finalHtml.replace(regex, String(val ?? ""));
    }
  }

  // Format HTML if needed
  finalHtml = formatSimulcastEmail(finalHtml);

  // Normalize all attachment inputs into an array
  const rawAttachments: EmailAttachment[] = [...(attachments || [])];
  if (attachment) {
    if (typeof attachment === "string") {
      rawAttachments.push({
        filename: attachment.split("/").pop() || "document.pdf",
        path: attachment,
      });
    } else if (typeof attachment === "object") {
      rawAttachments.push(attachment);
    }
  }

  // If attachCompanyProfile requested or explicitly asking to send company profile with attachment
  if (attachCompanyProfile) {
    try {
      const { ensureSimulcastDocs } = await import("@/lib/pdf-generator");
      const { profilePath } = await ensureSimulcastDocs();
      rawAttachments.push({
        filename: "Simulcast_Technologies_Company_Profile.pdf",
        path: profilePath,
        contentType: "application/pdf",
      });
    } catch (docErr) {
      console.warn("[PDF Doc Generation Warning]:", docErr);
    }
  }

  try {
    const mailClient = getTransporter();

    // Resolve local paths, base64 content, and remote URLs in attachments asynchronously
    const resolvedAttachments = await Promise.all(
      rawAttachments.map(async (att, idx) => {
        let filename = att.filename || `Simulcast_Attachment_${idx + 1}.pdf`;
        let contentType = att.contentType;
        let content: Buffer | string | undefined = att.content;
        let finalPath = att.path;

        // Check if path or filename indicates company profile or brochure
        if (
          finalPath === "company_profile" ||
          finalPath === "profile" ||
          filename.toLowerCase() === "company_profile"
        ) {
          try {
            const { ensureSimulcastDocs } = await import("@/lib/pdf-generator");
            const docs = await ensureSimulcastDocs();
            finalPath = docs.profilePath;
            filename = "Simulcast_Technologies_Company_Profile.pdf";
            contentType = "application/pdf";
          } catch {}
        } else if (finalPath === "brochure" || filename.toLowerCase() === "brochure") {
          try {
            const { ensureSimulcastDocs } = await import("@/lib/pdf-generator");
            const docs = await ensureSimulcastDocs();
            finalPath = docs.brochurePath;
            filename = "Simulcast_Solutions_Brochure.pdf";
            contentType = "application/pdf";
          } catch {}
        }

        // If remote URL is supplied, download content directly
        if (att.url && !content && !finalPath) {
          try {
            const res = await fetch(att.url);
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              return {
                filename,
                content: Buffer.from(arrayBuf),
                contentType: contentType || res.headers.get("content-type") || "application/octet-stream",
              };
            }
          } catch (err) {
            console.warn(`[Attachment Download Error] ${att.url}:`, err);
          }
        }

        // Handle Base64 string payload
        if (typeof content === "string") {
          const isDataUri = content.startsWith("data:");
          if (isDataUri) {
            const semi = content.indexOf(";");
            if (semi !== -1 && !contentType) {
              contentType = content.slice(5, semi);
            }
          }
          const cleanBase64 = content.replace(/^data:[^;]+;base64,/, "").trim();
          try {
            content = Buffer.from(cleanBase64, "base64");
          } catch {
            // Keep as string if not base64
          }
        }

        // If local public, docs, or upload path is supplied
        if (
          finalPath &&
          (finalPath.startsWith("/uploads/") ||
            finalPath.startsWith("/media/") ||
            finalPath.startsWith("/visuals/") ||
            finalPath.startsWith("/brand/") ||
            finalPath.startsWith("/docs/") ||
            finalPath.startsWith("uploads/") ||
            finalPath.startsWith("media/") ||
            finalPath.startsWith("docs/"))
        ) {
          const relPath = finalPath.replace(/^\//, "");
          const fullPath = require("path").join(process.cwd(), "public", relPath);
          return {
            filename,
            path: fullPath,
            contentType,
          };
        }

        return {
          filename,
          content,
          path: finalPath,
          contentType,
        };
      })
    );

    const info = await mailClient.sendMail({
      from: finalFrom,
      to: recipientList,
      cc: ccList,
      bcc: bccList,
      subject: finalSubject,
      html: finalHtml,
      text: text || finalHtml.replace(/<[^>]+>/g, " ").trim(),
      attachments: resolvedAttachments,
    });

    console.log(`[Email Sent] From: ${finalFrom} Subject: "${finalSubject}" to: ${recipientList} (ID: ${info.messageId})`);

    // Prepare attachment metadata for Webmail display
    const webmailAttachments = resolvedAttachments.map((a, i) => {
      const size = a.content
        ? Buffer.isBuffer(a.content)
          ? a.content.length
          : String(a.content).length
        : undefined;
      let url: string | undefined = undefined;
      if (typeof a.path === "string" && a.path.includes("public")) {
        url = a.path.split("public")[1].replace(/\\/g, "/");
      }
      return {
        id: `att_${i + 1}`,
        filename: a.filename || `attachment_${i + 1}`,
        contentType: a.contentType || "application/octet-stream",
        size,
        path: typeof a.path === "string" ? a.path : undefined,
        url,
      };
    });

    // Auto-record into Webmail Sent Folder
    try {
      const { recordWebmailOutgoingMessage } = await import("@/lib/webmail");
      await recordWebmailOutgoingMessage({
        from: finalFrom,
        fromAccount: senderEmail,
        fromEmail: senderEmail,
        to: recipientList,
        cc: ccList,
        bcc: bccList,
        subject: finalSubject,
        bodyHtml: finalHtml,
        bodyText: text,
        attachments: webmailAttachments,
        isSent: true,
        messageId: info.messageId,
      });
    } catch {}

    return { ok: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Email Delivery Notice] Failed sending email via SMTP: ${errorMsg}`);

    // Auto-record failure into Webmail for audit
    try {
      const { recordWebmailOutgoingMessage } = await import("@/lib/webmail");
      await recordWebmailOutgoingMessage({
        from: finalFrom,
        fromAccount: senderEmail,
        fromEmail: senderEmail,
        to: recipientList,
        cc: ccList,
        bcc: bccList,
        subject: finalSubject,
        bodyHtml: finalHtml,
        bodyText: text,
        isSent: false,
      });
    } catch {}

    return { ok: false, error: errorMsg };
  }
}


/**
 * Triggers an immediate alert to info@simulcast.com.np and support@simulcast.com.np
 * when a user requests human support.
 */
export async function sendHumanEscalationNotification({
  sessionId,
  visitorName,
  visitorEmail,
  visitorPhone,
  latestMessage,
  pageUrl,
}: {
  sessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  latestMessage?: string;
  pageUrl?: string;
}) {
  const recipients = defaultEscalation;
  const adminPanelUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.simulcast.com.np"}/admin/chat?sessionId=${sessionId}`;

  const subject = `[URGENT] Live Human Support Requested: ${visitorName || "Website Visitor"}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f7f5f9; padding: 24px; color: #221d27;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e8e2ec; box-shadow: 0 4px 18px rgba(43, 13, 58, 0.08);">
        <div style="background: linear-gradient(135deg, #2b0d3a 0%, #e11d72 100%); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Simulcast Live Chat Escalation</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">A website visitor has requested to speak with a human engineer/representative.</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #6d6975; width: 140px; font-weight: 600;">Visitor Name:</td>
              <td style="padding: 8px 0; color: #2b0d3a; font-weight: 700;">${visitorName || "Anonymous Visitor"}</td>
            </tr>
            ${visitorEmail ? `<tr><td style="padding: 8px 0; color: #6d6975; font-weight: 600;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${visitorEmail}" style="color: #e11d72;">${visitorEmail}</a></td></tr>` : ""}
            ${visitorPhone ? `<tr><td style="padding: 8px 0; color: #6d6975; font-weight: 600;">Phone:</td><td style="padding: 8px 0;">${visitorPhone}</td></tr>` : ""}
            ${pageUrl ? `<tr><td style="padding: 8px 0; color: #6d6975; font-weight: 600;">Current Page:</td><td style="padding: 8px 0;"><a href="${pageUrl}" style="color: #2b0d3a;">${pageUrl}</a></td></tr>` : ""}
            <tr>
              <td style="padding: 8px 0; color: #6d6975; font-weight: 600;">Session ID:</td>
              <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${sessionId}</td>
            </tr>
          </table>

          <div style="background: #faf7fb; border-left: 4px solid #e11d72; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
            <strong style="color: #2b0d3a; display: block; font-size: 13px; margin-bottom: 6px;">Triggering Message:</strong>
            <p style="margin: 0; font-size: 14px; color: #33263a; line-height: 1.5;">"${latestMessage || "User clicked human agent handoff"}"</p>
          </div>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${adminPanelUrl}" style="display: inline-block; background: #2b0d3a; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 4px; box-shadow: 0 4px 12px rgba(43, 13, 58, 0.25);">
              Open Admin Chat Panel →
            </a>
          </div>
        </div>
        <div style="background: #f7f4f9; padding: 16px 24px; border-top: 1px solid #e8e2ec; font-size: 11px; color: #877f8d; text-align: center;">
          Simulcast Technologies Pvt. Ltd. · Kumaripati, Lalitpur, Nepal · support@simulcast.com.np
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipients,
    subject,
    html,
  });
}

/**
 * Sends complete chat history transcript to support@simulcast.com.np
 */
export async function sendChatTranscriptEmail({
  sessionId,
  visitorName,
  visitorEmail,
  messages,
}: {
  sessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  messages: Array<{ sender: string; senderName: string; content: string; createdAt: Date }>;
}) {
  const subject = `[Chat Transcript] Session #${sessionId.slice(-6)} - ${visitorName || "Website Visitor"}`;

  const messageRows = messages
    .map(m => {
      const isUser = m.sender === "user";
      const isBot = m.sender === "bot";
      const badgeColor = isUser ? "#e11d72" : isBot ? "#6d437d" : "#2b0d3a";
      const bg = isUser ? "#fff0f7" : "#f7f5fa";

      return `
        <div style="margin-bottom: 12px; padding: 10px 14px; border-radius: 6px; background: ${bg}; border: 1px solid #eee5f0;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="font-weight: 700; color: ${badgeColor};">${m.senderName} (${m.sender})</span>
            <span style="color: #93899a;">${new Date(m.createdAt).toLocaleTimeString()}</span>
          </div>
          <div style="font-size: 13px; color: #221d27; line-height: 1.5; white-space: pre-wrap;">${m.content}</div>
        </div>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f7f5f9; padding: 24px; color: #221d27;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e8e2ec;">
        <div style="background: #2b0d3a; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Completed Chat Transcript</h2>
          <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.85;">Session ID: ${sessionId}</p>
        </div>
        <div style="padding: 20px 24px; border-bottom: 1px solid #eee5f0; background: #faf8fb;">
          <p style="margin: 0; font-size: 13px;"><strong>Visitor:</strong> ${visitorName || "Anonymous"} ${visitorEmail ? `&lt;${visitorEmail}&gt;` : ""}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #6d6975;">Total messages: ${messages.length}</p>
        </div>
        <div style="padding: 24px;">
          ${messageRows || "<p style='color: #8c7e93;'>No messages logged in this session.</p>"}
        </div>
        <div style="background: #f7f4f9; padding: 14px 24px; font-size: 11px; color: #877f8d; text-align: center;">
          Sent automatically to ${supportEmail} · Simulcast Technologies Live Support System
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: supportEmail,
    subject,
    html,
  });
}
