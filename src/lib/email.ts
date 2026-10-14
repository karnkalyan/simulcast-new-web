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
    });
  }
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const mailClient = getTransporter();
    const recipientList = Array.isArray(to) ? to.join(", ") : to;

    const info = await mailClient.sendMail({
      from: emailFrom,
      to: recipientList,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " "),
    });

    console.log(`[Email Sent] Subject: "${subject}" to: ${recipientList} (ID: ${info.messageId})`);
    return { ok: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Email Delivery Notice] Failed sending email via SMTP: ${errorMsg}`);
    // Return gracefully so the application continues to function smoothly
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
