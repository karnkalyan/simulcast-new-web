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
      // Query LinkedIn organizations for member if accessible
      try {
        const liRes = await fetch("https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee", {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        });
        if (liRes.ok) {
          const liData = await liRes.json();
          const elements = Array.isArray(liData.elements) ? liData.elements : [];
          const orgs = elements.map((item: any) => ({
            id: String(item.organizationalTarget || "").split(":").pop(),
            authorUrn: item.organizationalTarget,
            name: `Organization (${item.organizationalTarget})`,
            category: item.role || "ADMINISTRATOR",
            type: "ORGANIZATION",
          }));
          return NextResponse.json({ pages: orgs });
        }
      } catch {}
      return NextResponse.json({ pages: [] });
    }

    return NextResponse.json({ pages: [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve managed pages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
