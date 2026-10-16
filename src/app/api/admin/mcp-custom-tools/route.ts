import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getCustomMcpTools,
  saveCustomMcpTool,
  deleteCustomMcpTool,
  toggleCustomMcpTool,
} from "@/lib/mcp-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tools = await getCustomMcpTools();
    return NextResponse.json({ tools });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load custom MCP tools";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, title, description, category, enabled, parameters, handlerType, handlerConfig } = body;

    if (!name || !description || !handlerType) {
      return NextResponse.json({ error: "Name, description, and handlerType are required." }, { status: 400 });
    }

    const tool = await saveCustomMcpTool({
      id,
      name,
      title: title || name,
      description,
      category: category || "Custom",
      enabled: enabled !== undefined ? enabled : true,
      parameters,
      handlerType,
      handlerConfig,
    });

    return NextResponse.json({ ok: true, tool });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save custom MCP tool";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, enabled } = await request.json();
    if (!id || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "id and boolean enabled status are required." }, { status: 400 });
    }

    const res = await toggleCustomMcpTool(id, enabled);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to toggle custom tool";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const res = await deleteCustomMcpTool(id);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete custom tool";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
