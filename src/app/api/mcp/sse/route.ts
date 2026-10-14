import { NextResponse } from "next/server";
import { verifyMcpAuth } from "@/lib/mcp-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyMcpAuth(request);
  // ChatGPT connects to SSE to discover the POST endpoint; allow connection even if unauthenticated
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial endpoint event as required by MCP SSE specification
      const initEvent = `event: endpoint\ndata: /api/mcp\n\n`;
      controller.enqueue(encoder.encode(initEvent));

      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
