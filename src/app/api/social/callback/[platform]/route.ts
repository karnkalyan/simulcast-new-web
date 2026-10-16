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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3079";

  if (error || !code) {
    return NextResponse.redirect(
      `${baseUrl}/admin/social?error=${encodeURIComponent(errorDesc || error || "OAuth authorization was canceled.")}`
    );
  }

  const settings = await getSocialSettings();

  if (platform.toLowerCase() === "linkedin") {
    try {
      const redirectUri = `${baseUrl}/api/social/callback/linkedin`;
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: settings.linkedinClientId || "8629t1e7shscbw",
          client_secret: settings.linkedinClientSecret || "",
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        return NextResponse.redirect(
          `${baseUrl}/admin/social?oauth_success=linkedin&token=${encodeURIComponent(tokenData.access_token)}`
        );
      }
      return NextResponse.redirect(
        `${baseUrl}/admin/social?error=${encodeURIComponent(tokenData.error_description || "Failed retrieving LinkedIn access token.")}`
      );
    } catch (err: unknown) {
      return NextResponse.redirect(
        `${baseUrl}/admin/social?error=${encodeURIComponent(err instanceof Error ? err.message : "LinkedIn token exchange failed")}`
      );
    }
  }

  if (platform.toLowerCase() === "facebook") {
    try {
      const redirectUri = `${baseUrl}/api/social/callback/facebook`;
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${settings.facebookAppId}&client_secret=${settings.facebookAppSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
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
