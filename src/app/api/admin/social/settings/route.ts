import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSocialSettings, saveSocialSettings } from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSocialSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await saveSocialSettings({
      linkedinClientId: body.linkedinClientId,
      linkedinClientSecret: body.linkedinClientSecret,
      facebookAppId: body.facebookAppId,
      facebookAppSecret: body.facebookAppSecret,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Social media API configuration saved successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
