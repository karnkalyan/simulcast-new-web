import { NextResponse } from "next/server";
import { getCustomRouteByPath, recordCustomRouteHit } from "@/server/services/custom-routes.service";

async function handleCustomRequest(req: Request, slug: string[]) {
  const fullPath = "/api/" + slug.join("/");
  const method = req.method.toUpperCase();

  const route = await getCustomRouteByPath(fullPath, method);
  if (!route) {
    return NextResponse.json(
      {
        error: "Route not found",
        path: fullPath,
        method
      },
      { status: 404 }
    );
  }

  // Record hit in background
  recordCustomRouteHit(route.id).catch(() => {});

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", route.contentType || "application/json");
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

  // Apply custom headers if defined
  if (route.headers) {
    try {
      const parsed = JSON.parse(route.headers);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined && v !== null) {
            responseHeaders.set(k, String(v));
          }
        }
      }
    } catch {}
  }

  return new NextResponse(route.responseBody, {
    status: route.statusCode || 200,
    headers: responseHeaders
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleCustomRequest(req, slug);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleCustomRequest(req, slug);
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleCustomRequest(req, slug);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleCustomRequest(req, slug);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleCustomRequest(req, slug);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept"
    }
  });
}
