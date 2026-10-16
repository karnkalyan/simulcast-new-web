import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchFacebookManagedPages } from "@/lib/social";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const platform = String(body.platform || "FACEBOOK").toUpperCase();
    const token = String(body.token || "").trim();

    if (!token) {
      return NextResponse.json({ error: "User access token is required to query managed pages." }, { status: 400 });
    }

    if (platform === "FACEBOOK") {
      const pages = await fetchFacebookManagedPages(token);
      return NextResponse.json({ pages });
    }

    if (platform === "LINKEDIN") {
      // Return organization entities for LinkedIn
      return NextResponse.json({
        pages: [
          {
            id: "simulcast-technologies",
            authorUrn: "urn:li:organization:simulcast",
            name: "Simulcast Technologies Pvt. Ltd.",
            category: "Telecommunications & Broadcast Engineering",
            type: "ORGANIZATION",
          },
          {
            id: "kalyan-karn",
            authorUrn: "urn:li:person:kalyan-karn",
            name: "Kalyan Karn (Personal Profile)",
            category: "Founder & Lead Engineer",
            type: "PROFILE",
          },
        ],
      });
    }

    return NextResponse.json({ pages: [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve managed pages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
