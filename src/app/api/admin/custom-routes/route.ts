import { NextResponse } from "next/server";
import { getSession, sameOrigin } from "@/lib/auth";
import {
  listCustomRoutes,
  createCustomRoute
} from "@/server/services/custom-routes.service";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const routes = await listCustomRoutes();
    return NextResponse.json(routes);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load custom routes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const created = await createCustomRoute(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid custom route data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
