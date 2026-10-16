import { NextResponse } from "next/server";
import { getSocialSettings } from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : new URL(request.url).origin);

  if (error || !code) {
    return NextResponse.redirect(
      `${baseUrl}/admin/social?error=${encodeURIComponent(errorDesc || error || "OAuth authorization was canceled.")}`
    );
  }

  const settings = await getSocialSettings();

  if (platform.toLowerCase() === "linkedin") {
    try {
      const clientId = settings.linkedinClientId || process.env.LINKEDIN_CLIENT_ID || "";
      const clientSecret = settings.linkedinClientSecret || process.env.LINKEDIN_CLIENT_SECRET || "";

      if (!clientId || !clientSecret) {
        return NextResponse.redirect(
          `${baseUrl}/admin/social?error=${encodeURIComponent("LinkedIn Client ID or Client Secret not configured. Please enter them in API Keys & OAuth.")}`
        );
      }

      const redirectUri = `${baseUrl}/api/social/callback/linkedin`;
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        let authorUrn = "";
        let authorName = "";
        try {
          const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (userRes.ok) {
            const userInfo = await userRes.json();
            if (userInfo.sub) {
              authorUrn = `urn:li:person:${userInfo.sub}`;
            }
            authorName = userInfo.name || "";
          }
        } catch {}

        const redirectUrl = new URL(`${baseUrl}/admin/social`);
        redirectUrl.searchParams.set("oauth_success", "linkedin");
        redirectUrl.searchParams.set("token", tokenData.access_token);
        if (authorUrn) redirectUrl.searchParams.set("urn", authorUrn);
        if (authorName) redirectUrl.searchParams.set("name", authorName);

        return NextResponse.redirect(redirectUrl.toString());
      }
      return NextResponse.redirect(
        `${baseUrl}/admin/social?error=${encodeURIComponent(tokenData.error_description || tokenData.error || "Failed retrieving LinkedIn access token.")}`
      );
    } catch (err: unknown) {
      return NextResponse.redirect(
        `${baseUrl}/admin/social?error=${encodeURIComponent(err instanceof Error ? err.message : "LinkedIn token exchange failed")}`
      );
    }
  }

  if (platform.toLowerCase() === "facebook") {
    try {
      const appId = settings.facebookAppId || process.env.FACEBOOK_APP_ID || "";
      const appSecret = settings.facebookAppSecret || process.env.FACEBOOK_APP_SECRET || "";

      if (!appId || !appSecret) {
        return NextResponse.redirect(
          `${baseUrl}/admin/social?error=${encodeURIComponent("Facebook App ID or App Secret not configured. Please enter them in API Keys & OAuth.")}`
        );
      }

      const redirectUri = `${baseUrl}/api/social/callback/facebook`;
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`
      );
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        return NextResponse.redirect(
          `${baseUrl}/admin/social?oauth_success=facebook&token=${encodeURIComponent(tokenData.access_token)}`
        );
      }
      return NextResponse.redirect(
        `${baseUrl}/admin/social?error=${encodeURIComponent(tokenData.error?.message || "Failed retrieving Facebook access token.")}`
      );
    } catch (err: unknown) {
      return NextResponse.redirect(
        `${baseUrl}/admin/social?error=${encodeURIComponent(err instanceof Error ? err.message : "Facebook token exchange failed")}`
      );
    }
  }

  return NextResponse.redirect(`${baseUrl}/admin/social`);
}
