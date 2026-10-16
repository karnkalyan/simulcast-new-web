import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getSocialAccounts,
  getSocialPosts,
  getSocialSettings,
  publishCrossPlatformPost,
} from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [accounts, posts, settings] = await Promise.all([
      getSocialAccounts(),
      getSocialPosts(),
      getSocialSettings(),
    ]);

    return NextResponse.json({
      accounts,
      posts,
      settings,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed loading social media status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content = String(body.content || "").trim();
    const mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : undefined;
    const platforms = body.platforms as Array<"LINKEDIN" | "FACEBOOK" | "INSTAGRAM">;

    if (!content) {
      return NextResponse.json({ error: "Post text content is required." }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "Please select at least one social media platform to publish." }, { status: 400 });
    }

    const postRecord = await publishCrossPlatformPost({
      content,
      mediaUrl,
      targetPlatforms: platforms,
      author: admin.email || "Admin",
    });

    return NextResponse.json({
      success: true,
      post: postRecord,
      message: `Published to ${platforms.join(", ")}. Status: ${postRecord.status}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to publish social post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
