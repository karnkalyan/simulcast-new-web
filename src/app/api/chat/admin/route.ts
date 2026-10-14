import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendChatTranscriptEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/admin
 * Returns sessions for admin live chat console
 */
export async function GET(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // ACTIVE | ESCALATED_HUMAN | CLOSED | all
  const sessionId = searchParams.get("sessionId");

  try {
    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
      return NextResponse.json({ session });
    }

    const whereClause: { status?: "ACTIVE" | "ESCALATED_HUMAN" | "CLOSED" } = {};
    if (status && status !== "all") {
      whereClause.status = status as "ACTIVE" | "ESCALATED_HUMAN" | "CLOSED";
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
      take: 50,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[Admin Chat GET error]", error);
    return NextResponse.json({ error: "Failed to fetch admin chat sessions" }, { status: 500 });
  }
}

/**
 * POST /api/chat/admin
 * Admin sends a message to visitor in a session
 */
export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, content } = await request.json();
    if (!sessionId || !content) {
      return NextResponse.json({ error: "sessionId and content required" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: "human_agent",
        senderName: "Support Representative",
        content: String(content).trim(),
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "ESCALATED_HUMAN",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error("[Admin Chat POST error]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

/**
 * PUT /api/chat/admin
 * Admin updates status or triggers transcript email
 */
export async function PUT(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, action, status } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    if (action === "send_transcript" || status === "CLOSED") {
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

      const emailResult = await sendChatTranscriptEmail({
        sessionId: session.id,
        visitorName: session.visitorName,
        visitorEmail: session.visitorEmail,
        messages: session.messages,
      });

      return NextResponse.json({
        ok: true,
        message: "Transcript sent to support@simulcast.com.np",
        emailDelivery: emailResult,
      });
    }

    if (status) {
      const updated = await prisma.chatSession.update({
        where: { id: sessionId },
        data: { status },
      });
      return NextResponse.json({ ok: true, session: updated });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin Chat PUT error]", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
