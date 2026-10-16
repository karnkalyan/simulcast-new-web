import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSocialAccounts, saveSocialAccounts } from "@/lib/social";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const platform = String(body.platform || "").toUpperCase();

    if (!platform) {
      return NextResponse.json({ error: "Platform name is required" }, { status: 400 });
    }

    const accounts = await getSocialAccounts();
    const target = accounts.find((a) => a.platform === platform);
    const updated = accounts.filter((a) => a.platform !== platform);

    await saveSocialAccounts(updated);

    await logAudit({
      action: `SOCIAL_ACCOUNT_DISCONNECTED_${platform}`,
      category: "SETTINGS",
      actor: admin.email || "Admin",
      target: platform,
      details: `Disconnected ${platform} account ${target?.accountName || ""}`,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${platform}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to disconnect account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
