import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateGeminiReply, detectHumanEscalationIntent } from "@/lib/gemini";
import { sendHumanEscalationNotification, sendChatTranscriptEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat?sessionId=xyz
 * Returns session state and all messages
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query parameter required" }, { status: 400 });
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("[Chat GET error]", error);
    return NextResponse.json({ error: "Failed to fetch chat session" }, { status: 500 });
  }
}

/**
 * POST /api/chat
 * Handles sending a message from visitor.
 * Evaluates human escalation or generates Gemini AI answer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sessionId: existingSessionId,
      message,
      visitorId = "anon-" + Math.random().toString(36).slice(2, 9),
      visitorName = "Website Visitor",
      visitorEmail = "",
      visitorPhone = "",
      pageUrl = "",
      requestHuman = false,
    } = body;

    if (!message && !requestHuman) {
      return NextResponse.json({ error: "Message or human handoff request required" }, { status: 400 });
    }

    // Retrieve or create ChatSession
    let session = existingSessionId
      ? await prisma.chatSession.findUnique({
          where: { id: existingSessionId },
          include: { messages: true },
        })
      : null;

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          visitorId,
          visitorName: visitorName || "Website Visitor",
          visitorEmail: visitorEmail || "",
          visitorPhone: visitorPhone || "",
          status: "ACTIVE",
        },
        include: { messages: true },
      });
    }

    // Save visitor message to DB
    const incomingText = message ? String(message).trim() : "[Requested Human Support Agent]";
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "user",
        senderName: visitorName || "Visitor",
        content: incomingText,
      },
    });

    // Check if human escalation was requested explicitly or detected via NLP
    const needsHuman = requestHuman || detectHumanEscalationIntent(incomingText);

    if (needsHuman) {
      if (session.status !== "ESCALATED_HUMAN") {
        await prisma.chatSession.update({
          where: { id: session.id },
          data: {
            status: "ESCALATED_HUMAN",
            escalatedAt: new Date(),
          },
        });

        // Trigger immediate email alert to info@simulcast.com.np & support@simulcast.com.np
        await sendHumanEscalationNotification({
          sessionId: session.id,
          visitorName,
          visitorEmail,
          visitorPhone,
          latestMessage: incomingText,
          pageUrl,
        });
      }

      const botReplyText =
        "Connecting you with our support team. A representative will assist you right here in this chat shortly.";

      const botMsg = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          sender: "system",
          senderName: "Simulcast Support",
          content: botReplyText,
        },
      });

      return NextResponse.json({
        sessionId: session.id,
        reply: botMsg,
        status: "ESCALATED_HUMAN",
      });
    }

    // If already escalated to human, don't generate Gemini AI response; wait for human agent
    if (session.status === "ESCALATED_HUMAN") {
      return NextResponse.json({
        sessionId: session.id,
        status: "ESCALATED_HUMAN",
        waitingForAgent: true,
      });
    }

    // Otherwise, generate response using Gemini 2.5 Flash
    const history = session.messages.map((m: { sender: string; content: string }) => ({
      sender: m.sender,
      content: m.content,
    }));

    const geminiResult = await generateGeminiReply(history, incomingText);

    if (geminiResult.isHumanRequest) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          status: "ESCALATED_HUMAN",
          escalatedAt: new Date(),
        },
      });

      await sendHumanEscalationNotification({
        sessionId: session.id,
        visitorName,
        visitorEmail,
        visitorPhone,
        latestMessage: incomingText,
        pageUrl,
      });
    }

    const botMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "bot",
        senderName: "Simulcast Assistant",
        content: geminiResult.text,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      reply: botMessage,
      status: geminiResult.isHumanRequest ? "ESCALATED_HUMAN" : "ACTIVE",
    });
  } catch (error) {
    console.error("[Chat POST error]", error);
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
  }
}

/**
 * PUT /api/chat
 * Closes the chat session and emails full transcript to support@simulcast.com.np
 */
export async function PUT(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        transcriptSent: true,
      },
    });

    // Send transcript email to support@simulcast.com.np
    await sendChatTranscriptEmail({
      sessionId: session.id,
      visitorName: session.visitorName,
      visitorEmail: session.visitorEmail,
      messages: session.messages,
    });

    return NextResponse.json({ ok: true, message: "Chat session closed and transcript emailed." });
  } catch (error) {
    console.error("[Chat PUT error]", error);
    return NextResponse.json({ error: "Failed to close chat session" }, { status: 500 });
  }
}
