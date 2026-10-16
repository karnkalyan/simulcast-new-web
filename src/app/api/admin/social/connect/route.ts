import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSocialAccounts, saveSocialAccounts, SocialAccountItem } from "@/lib/social";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const platform = String(body.platform || "").toUpperCase() as "LINKEDIN" | "FACEBOOK" | "INSTAGRAM";
    const accountName = String(body.accountName || "").trim();
    const targetId = String(body.targetId || "").trim();
    const accessToken = String(body.accessToken || "").trim();
    const authorUrn = body.authorUrn ? String(body.authorUrn).trim() : undefined;
    const pageUrl = body.pageUrl ? String(body.pageUrl).trim() : undefined;
    const category = body.category ? String(body.category).trim() : undefined;
    const fanCount = typeof body.fanCount === "number" ? body.fanCount : undefined;
    const instagramAccount = body.instagramAccount;

    if (!platform || !accountName || !targetId || !accessToken) {
      return NextResponse.json({ error: "Missing required fields (platform, accountName, targetId, accessToken)." }, { status: 400 });
    }

    const accounts = await getSocialAccounts();

    // Remove existing connection for this platform
    const updated = accounts.filter((a) => a.platform !== platform);

    const newAccount: SocialAccountItem = {
      id: `acc_${platform.toLowerCase()}_${targetId}`,
      platform,
      accountName,
      accountType: platform === "LINKEDIN" ? (body.accountType || "ORGANIZATION") : "PAGE",
      targetId,
      authorUrn,
      accessToken,
      pageUrl: pageUrl || (platform === "LINKEDIN" ? `https://www.linkedin.com/company/${targetId}` : `https://www.facebook.com/${targetId}`),
      avatarUrl: "/media/logo-mark.png",
      category: category || "Company",
      fanCount,
      status: "CONNECTED",
      connectedAt: new Date().toISOString(),
      lastPostAt: null,
    };

    updated.push(newAccount);

    // If Facebook page also had a linked Instagram account, automatically connect/update Instagram!
    if (platform === "FACEBOOK" && instagramAccount && instagramAccount.id) {
      const filteredNoIg = updated.filter((a) => a.platform !== "INSTAGRAM");
      filteredNoIg.push({
        id: `acc_instagram_${instagramAccount.id}`,
        platform: "INSTAGRAM",
        accountName: `@${instagramAccount.username || "simulcast_technologies"}`,
        accountType: "BUSINESS_ACCOUNT",
        targetId: instagramAccount.id,
        accessToken, // Instagram Graph uses the Facebook Page token
        pageUrl: `https://www.instagram.com/${instagramAccount.username || "simulcast_technologies"}`,
        avatarUrl: "/media/logo-mark.png",
        category: "Connected Instagram Business Account",
        status: "CONNECTED",
        connectedAt: new Date().toISOString(),
        lastPostAt: null,
      });
      await saveSocialAccounts(filteredNoIg);
    } else {
      await saveSocialAccounts(updated);
    }

    await logAudit({
      action: `SOCIAL_ACCOUNT_CONNECTED_${platform}`,
      category: "SETTINGS",
      actor: admin.email || "Admin",
      target: `${platform} (${accountName})`,
      details: `Connected ${platform} account ${accountName} (ID: ${targetId})`,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      account: newAccount,
      message: `Successfully connected ${platform} account "${accountName}".`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to connect social account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
