import { NextResponse } from "next/server";
import { getSession, sameOrigin } from "@/lib/auth";
import { toggleCustomRoute } from "@/server/services/custom-routes.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const updated = await toggleCustomRoute(id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle custom route";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
