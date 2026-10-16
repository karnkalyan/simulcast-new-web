import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { logEmailDelivery } from "@/lib/email-queue";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "Valued Client").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "Request for Simulcast Technologies Company Profile & Products").trim();
    const organization = String(body.organization || "").trim();
    const phone = String(body.phone || "").trim();
    const interest = String(body.interest || "Company Profile & Products").trim();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    // 1. Log Inquiry to database (with fallback catch)
    let inquiryId = `inq_${Date.now()}`;
    try {
      const created = await prisma.inquiry.create({
        data: {
          name,
          email,
          organization,
          phone,
          interest,
          message,
          internalNotes: "Submitted via ChatGPT Action / MCP Inquiry Endpoint",
        },
      });
      inquiryId = created.id;
    } catch (e) {
      console.warn("Could not write inquiry to DB, proceeding with email dispatch:", e);
    }

    // 2. Build rich branded company profile & product catalog email
    const subject = "Simulcast Technologies Pvt. Ltd. — Official Company Profile & Solutions Catalog";
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #eae4eb; border-radius: 8px; color: #2b0d3a; background-color: #ffffff;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #e11d72; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="margin: 0; color: #2b0d3a; font-size: 24px; letter-spacing: -0.5px;">Simulcast Technologies</h1>
          <p style="margin: 4px 0 0; color: #e11d72; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
            Engineering Critical IT, Broadcast & Telecom Infrastructure
          </p>
        </div>

        <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a3e52;">
          Thank you for your interest in <strong>Simulcast Technologies Pvt. Ltd.</strong> We are delighted to share our comprehensive company profile, specialized technical capabilities, and product catalog with you.
        </p>

        <!-- Company Overview Box -->
        <div style="background: #faf7fb; border-left: 4px solid #2b0d3a; padding: 16px; border-radius: 0 6px 6px 0; margin: 20px 0;">
          <h3 style="margin: 0 0 8px; color: #2b0d3a; font-size: 16px;">Who We Are</h3>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #5a4b63;">
            Simulcast Technologies is a premier engineering powerhouse based in Kathmandu, Nepal. We specialize in high-density digital broadcast infrastructure, carrier-grade optical fiber ISP backbones, bespoke software platforms (SIMUL suite), and autonomous AI enterprise solutions.
          </p>
        </div>

        <!-- 6 Core Engineering Pillars -->
        <h3 style="color: #2b0d3a; font-size: 17px; margin-top: 24px; border-bottom: 1px solid #eae4eb; padding-bottom: 8px;">
          Core Solutions & Technical Portfolio
        </h3>

        <div style="display: grid; gap: 12px; margin-top: 14px;">
          <div style="padding: 12px; border: 1px solid #f0eaf2; border-radius: 6px; background: #fff;">
            <strong style="color: #e11d72; font-size: 14px;">1. RF & Digital Broadcast Engineering</strong>
            <p style="margin: 4px 0 0; font-size: 13px; color: #4a3e52; line-height: 1.5;">
              High-power FM & DVB-T2/ISDB-T transmitters, antenna array pattern optimization, RF combiners, and remote telemetry monitoring across challenging mountainous topographies.
            </p>
          </div>

          <div style="padding: 12px; border: 1px solid #f0eaf2; border-radius: 6px; background: #fff;">
            <strong style="color: #e11d72; font-size: 14px;">2. IPTV, OTT & Playout Automation</strong>
            <p style="margin: 4px 0 0; font-size: 13px; color: #4a3e52; line-height: 1.5;">
              Cloud & on-premises 24/7 master control playout, low-latency live transcoding, adaptive bitrate HLS/DASH streaming, and custom iOS/Android/Smart TV OTT applications.
            </p>
          </div>

          <div style="padding: 12px; border: 1px solid #f0eaf2; border-radius: 6px; background: #fff;">
            <strong style="color: #e11d72; font-size: 14px;">3. Carrier-Grade Optical Fiber & ISP Infrastructure</strong>
            <p style="margin: 4px 0 0; font-size: 13px; color: #4a3e52; line-height: 1.5;">
              DWDM/CWDM optical transport, high-capacity GPON/XGS-PON OLT deployments, BGP multi-homing routing, CGNAT, and TR-069 ACS remote device provisioning.
            </p>
          </div>

          <div style="padding: 12px; border: 1px solid #f0eaf2; border-radius: 6px; background: #fff;">
            <strong style="color: #e11d72; font-size: 14px;">4. SIMUL Software Product Suite</strong>
            <p style="margin: 4px 0 0; font-size: 13px; color: #4a3e52; line-height: 1.5;">
              Tailored telecommunications billing engines, subscriber management systems, fiber splitter GIS mapping, and automated payment gateway integrations.
            </p>
          </div>

          <div style="padding: 12px; border: 1px solid #f0eaf2; border-radius: 6px; background: #fff;">
            <strong style="color: #e11d72; font-size: 14px;">5. Enterprise AI Agents & Model Context Protocol (MCP)</strong>
            <p style="margin: 4px 0 0; font-size: 13px; color: #4a3e52; line-height: 1.5;">
              Production-grade MCP server infrastructure connecting AI models (ChatGPT, Claude) directly to operational backends, CRM, email dispatches, and live telemetry.
            </p>
          </div>
        </div>

        <!-- Contact Box -->
        <div style="background: #2b0d3a; color: #ffffff; padding: 18px; border-radius: 6px; margin-top: 26px;">
          <h4 style="margin: 0 0 6px; color: #fdf2f8; font-size: 15px;">Simulcast Technologies Pvt. Ltd.</h4>
          <p style="margin: 0; font-size: 13px; color: #e4d8ec; line-height: 1.5;">
            📍 Kathmandu, Bagmati Province, Nepal<br/>
            ✉️ <strong>Support:</strong> <a href="mailto:support@simulcast.com.np" style="color:#f472b6;">support@simulcast.com.np</a><br/>
            🌐 <strong>Website:</strong> <a href="https://www.simulcast.com.np" style="color:#f472b6;">https://www.simulcast.com.np</a>
          </p>
        </div>

        <p style="font-size: 12px; color: #9d8f9e; margin-top: 20px; border-top: 1px solid #eae4eb; padding-top: 12px;">
          This official message was dispatched on your behalf from Simulcast Technologies automated services (Inquiry Ref: #${inquiryId}).
        </p>
      </div>
    `;

    // 3. Dispatch the email directly from support@simulcast.com.np to the requester
    const mailRes = await sendEmail({
      to: email,
      subject,
      html,
      text: `Dear ${name},\n\nThank you for contacting Simulcast Technologies. Please review our full company profile and products at https://www.simulcast.com.np or email us at support@simulcast.com.np.`,
    });

    await logEmailDelivery({
      to: email,
      subject,
      status: mailRes.ok ? "SENT" : "FAILED",
      source: "INQUIRY_AUTO_REPLY",
      messageId: mailRes.messageId || null,
      error: mailRes.error || null,
      hasAttachments: false,
      clientIdentity: "Simulcast System",
    });

    await logAudit({
      action: "INQUIRY_EMAIL_DISPATCHED",
      category: "EMAIL",
      actor: "Inquiry Service",
      target: email,
      details: `Dispatched company profile to ${email} (Status: ${mailRes.ok ? "SENT" : "FAILED"})`,
      status: mailRes.ok ? "SUCCESS" : "FAILED",
    });

    // 4. Also notify internal team
    sendEmail({
      to: "support@simulcast.com.np",
      subject: `[New Inquiry #${inquiryId}] From ${name} (${email})`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Organization:</strong> ${organization || "N/A"}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Interest:</strong> ${interest || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      inquiryId,
      emailDelivered: mailRes.ok,
      message: `Inquiry #${inquiryId} logged. Company profile and product catalog email sent from support@simulcast.com.np to ${email}.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error processing inquiry";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
