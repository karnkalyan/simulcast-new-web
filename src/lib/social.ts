import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { logAudit } from "@/lib/audit";

export interface SocialAccountItem {
  id: string;
  platform: "LINKEDIN" | "FACEBOOK" | "INSTAGRAM";
  accountName: string;
  accountType: "ORGANIZATION" | "PROFILE" | "PAGE" | "BUSINESS_ACCOUNT";
  targetId: string; // e.g. organization ID, FB page ID, IG business ID
  authorUrn?: string; // e.g. urn:li:organization:12345 or urn:li:person:abcdef
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  avatarUrl?: string;
  pageUrl?: string;
  category?: string;
  fanCount?: number;
  status: "CONNECTED" | "DISCONNECTED" | "EXPIRED";
  connectedAt: string;
  lastPostAt?: string | null;
}

export interface SocialPlatformResult {
  platform: "LINKEDIN" | "FACEBOOK" | "INSTAGRAM";
  status: "PUBLISHED" | "FAILED" | "PENDING";
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface SocialPostItem {
  id: string;
  content: string;
  mediaUrl?: string;
  author: string;
  platforms: SocialPlatformResult[];
  status: "PUBLISHED" | "PARTIAL" | "FAILED";
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialSettingsConfig {
  linkedinClientId: string;
  linkedinClientSecret: string;
  facebookAppId: string;
  facebookAppSecret: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "social-accounts.json");
const POSTS_FILE = path.join(DATA_DIR, "social-posts.json");
const SETTINGS_FILE = path.join(DATA_DIR, "social-settings.json");

const DEFAULT_SETTINGS: SocialSettingsConfig = {
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID || "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
  facebookAppId: process.env.FACEBOOK_APP_ID || "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET || "",
};

const DEFAULT_ACCOUNTS: SocialAccountItem[] = [];

const DEFAULT_POSTS: SocialPostItem[] = [];

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function getSocialSettings(): Promise<SocialSettingsConfig> {
  await ensureDir();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSocialSettings(cfg: Partial<SocialSettingsConfig>): Promise<SocialSettingsConfig> {
  await ensureDir();
  const current = await getSocialSettings();
  const updated: SocialSettingsConfig = {
    ...current,
    ...cfg,
  };
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

export async function getSocialAccounts(): Promise<SocialAccountItem[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(DEFAULT_ACCOUNTS, null, 2), "utf-8");
    return DEFAULT_ACCOUNTS;
  }
}

export async function saveSocialAccounts(accounts: SocialAccountItem[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
}

export async function getSocialPosts(): Promise<SocialPostItem[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(POSTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    await fs.writeFile(POSTS_FILE, JSON.stringify(DEFAULT_POSTS, null, 2), "utf-8");
    return DEFAULT_POSTS;
  }
}

export async function saveSocialPosts(posts: SocialPostItem[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts.slice(0, 200), null, 2), "utf-8");
}

// ==========================================
// 1. LINKEDIN PUBLISHING & INTEGRATION
// ==========================================

export async function postToLinkedIn({
  account,
  commentary,
  mediaUrl,
}: {
  account: SocialAccountItem;
  commentary: string;
  mediaUrl?: string;
}): Promise<SocialPlatformResult> {
  if (!account.accessToken || account.accessToken.trim().length === 0) {
    return {
      platform: "LINKEDIN",
      status: "FAILED",
      error: "LinkedIn access token is missing. Please connect your LinkedIn account.",
    };
  }

  const authorUrn =
    account.authorUrn ||
    (account.accountType === "ORGANIZATION"
      ? `urn:li:organization:${account.targetId}`
      : `urn:li:person:${account.targetId}`);

  // 1. Try modern LinkedIn REST Posts API (POST https://api.linkedin.com/rest/posts)
  try {
    const postPayload: Record<string, unknown> = {
      author: authorUrn,
      commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "LinkedIn-Version": "202404",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postPayload),
    });

    if (res.ok) {
      const postIdHeader = res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id");
      const postId = postIdHeader || `urn:li:share:${Date.now()}`;
      return {
        platform: "LINKEDIN",
        status: "PUBLISHED",
        postId,
        postUrl: `https://www.linkedin.com/feed/update/${postId}`,
      };
    }

    // If rest/posts returned error, attempt fallback to /v2/ugcPosts
    const restErr = await res.text().catch(() => "");
    console.warn("[LinkedIn REST API Notice, attempting v2/ugcPosts fallback]:", restErr);

    const v2Payload = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: commentary,
          },
          shareMediaCategory: mediaUrl ? "ARTICLE" : "NONE",
          ...(mediaUrl
            ? {
                media: [
                  {
                    status: "READY",
                    originalUrl: mediaUrl.startsWith("http") ? mediaUrl : `https://www.simulcast.com.np${mediaUrl}`,
                    title: { text: "Simulcast Technologies" },
                  },
                ],
              }
            : {}),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const v2Res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(v2Payload),
    });

    if (v2Res.ok) {
      const data = await v2Res.json().catch(() => ({}));
      const id = data.id || `urn:li:share:${Date.now()}`;
      return {
        platform: "LINKEDIN",
        status: "PUBLISHED",
        postId: id,
        postUrl: `https://www.linkedin.com/feed/update/${id}`,
      };
    }

    const v2Err = await v2Res.text().catch(() => "");
    return {
      platform: "LINKEDIN",
      status: "FAILED",
      error: `LinkedIn API error: ${v2Err || restErr || "Unauthorized or invalid permissions"}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      platform: "LINKEDIN",
      status: "FAILED",
      error: errorMsg,
    };
  }
}

// ==========================================
// 2. FACEBOOK & INSTAGRAM PUBLISHING
// ==========================================

export async function postToFacebook({
  account,
  message,
  mediaUrl,
}: {
  account: SocialAccountItem;
  message: string;
  mediaUrl?: string;
}): Promise<SocialPlatformResult> {
  if (!account.accessToken || account.accessToken.trim().length === 0) {
    return {
      platform: "FACEBOOK",
      status: "FAILED",
      error: "Facebook Page access token is missing. Please connect your Facebook Page.",
    };
  }

  try {
    const pageId = account.targetId;
    let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const params = new URLSearchParams({
      access_token: account.accessToken,
    });

    if (mediaUrl) {
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      const fullMediaUrl = mediaUrl.startsWith("http") ? mediaUrl : `https://www.simulcast.com.np${mediaUrl}`;
      params.set("url", fullMediaUrl);
      params.set("caption", message);
    } else {
      params.set("message", message);
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.id) {
      return {
        platform: "FACEBOOK",
        status: "PUBLISHED",
        postId: data.id,
        postUrl: `https://www.facebook.com/${data.id}`,
      };
    }

    return {
      platform: "FACEBOOK",
      status: "FAILED",
      error: data.error?.message || "Failed publishing to Facebook Page",
    };
  } catch (err: unknown) {
    return {
      platform: "FACEBOOK",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function postToInstagram({
  account,
  caption,
  mediaUrl,
}: {
  account: SocialAccountItem;
  caption: string;
  mediaUrl?: string;
}): Promise<SocialPlatformResult> {
  if (!account.accessToken || account.accessToken.trim().length === 0) {
    return {
      platform: "INSTAGRAM",
      status: "FAILED",
      error: "Instagram access token is missing. Please connect your account.",
    };
  }

  // Instagram Graph API requires an image URL for posting
  const fullImageUrl = mediaUrl
    ? mediaUrl.startsWith("http")
      ? mediaUrl
      : `https://www.simulcast.com.np${mediaUrl}`
    : "https://www.simulcast.com.np/media/infrastructure-rack.webp";

  try {
    const igUserId = account.targetId;

    // Step 1: Create media container
    const step1Params = new URLSearchParams({
      image_url: fullImageUrl,
      caption,
      access_token: account.accessToken,
    });

    const step1Res = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: step1Params.toString(),
    });

    const step1Data = await step1Res.json().catch(() => ({}));
    if (!step1Res.ok || !step1Data.id) {
      return {
        platform: "INSTAGRAM",
        status: "FAILED",
        error: step1Data.error?.message || "Failed to create Instagram media container.",
      };
    }

    const containerId = step1Data.id;

    // Step 2: Publish container
    const step2Params = new URLSearchParams({
      creation_id: containerId,
      access_token: account.accessToken,
    });

    const step2Res = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: step2Params.toString(),
    });

    const step2Data = await step2Res.json().catch(() => ({}));
    if (step2Res.ok && step2Data.id) {
      return {
        platform: "INSTAGRAM",
        status: "PUBLISHED",
        postId: step2Data.id,
        postUrl: `https://www.instagram.com/p/${step2Data.id}/`,
      };
    }

    return {
      platform: "INSTAGRAM",
      status: "FAILED",
      error: step2Data.error?.message || "Failed to publish Instagram container.",
    };
  } catch (err: unknown) {
    return {
      platform: "INSTAGRAM",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ==========================================
// 3. MULTI-PLATFORM UNIFIED PUBLISHER
// ==========================================

export async function publishCrossPlatformPost({
  content,
  mediaUrl,
  targetPlatforms,
  author = "Admin",
}: {
  content: string;
  mediaUrl?: string;
  targetPlatforms: Array<"LINKEDIN" | "FACEBOOK" | "INSTAGRAM">;
  author?: string;
}): Promise<SocialPostItem> {
  const accounts = await getSocialAccounts();
  const results: SocialPlatformResult[] = [];

  for (const plat of targetPlatforms) {
    const acc = accounts.find((a) => a.platform === plat && a.status === "CONNECTED");
    if (!acc) {
      results.push({
        platform: plat,
        status: "FAILED",
        error: `No connected ${plat} account found in settings.`,
      });
      continue;
    }

    if (plat === "LINKEDIN") {
      const res = await postToLinkedIn({ account: acc, commentary: content, mediaUrl });
      results.push(res);
      if (res.status === "PUBLISHED") {
        acc.lastPostAt = new Date().toISOString();
      }
    } else if (plat === "FACEBOOK") {
      const res = await postToFacebook({ account: acc, message: content, mediaUrl });
      results.push(res);
      if (res.status === "PUBLISHED") {
        acc.lastPostAt = new Date().toISOString();
      }
    } else if (plat === "INSTAGRAM") {
      const res = await postToInstagram({ account: acc, caption: content, mediaUrl });
      results.push(res);
      if (res.status === "PUBLISHED") {
        acc.lastPostAt = new Date().toISOString();
      }
    }
  }

  await saveSocialAccounts(accounts);

  const publishedCount = results.filter((r) => r.status === "PUBLISHED").length;
  const overallStatus =
    publishedCount === results.length ? "PUBLISHED" : publishedCount > 0 ? "PARTIAL" : "FAILED";

  const postRecord: SocialPostItem = {
    id: `spost_${randomUUID().slice(0, 8)}`,
    content,
    mediaUrl,
    author,
    platforms: results,
    status: overallStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allPosts = await getSocialPosts();
  allPosts.unshift(postRecord);
  await saveSocialPosts(allPosts);

  await logAudit({
    action: "SOCIAL_POST_PUBLISHED",
    category: "MCP",
    actor: author,
    target: targetPlatforms.join(", "),
    details: `Published cross-platform social post. Status: ${overallStatus} (${publishedCount}/${results.length} successful)`,
    status: overallStatus === "FAILED" ? "FAILED" : "SUCCESS",
  });

  return postRecord;
}

// ==========================================
// 4. FACEBOOK PAGE DISCOVERY HELPER
// ==========================================

export async function fetchFacebookManagedPages(userAccessToken: string): Promise<
  Array<{
    id: string;
    name: string;
    category: string;
    accessToken: string;
    fanCount?: number;
    instagramBusinessAccount?: {
      id: string;
      username: string;
      name?: string;
    };
  }>
> {
  const token = (userAccessToken || "").trim();
  if (!token) {
    throw new Error("Meta User Access Token is required to discover your managed Facebook Pages.");
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,access_token,fan_count,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to load managed Facebook Pages from Graph API.");
  }

  const data = await res.json();
  const rawPages = data.data || [];

  if (rawPages.length === 0) {
    try {
      const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${encodeURIComponent(token)}`);
      if (permRes.ok) {
        const permData = await permRes.json();
        const granted = (permData.data || [])
          .filter((p: any) => p.status === "granted")
          .map((p: any) => p.permission);
        if (!granted.includes("pages_show_list")) {
          throw new Error(
            `Token is missing 'pages_show_list' permission (currently granted: ${granted.join(", ") || "none"}). In Meta Graph API Explorer, click 'Add a Permission' > Events, Groups & Pages > select 'pages_show_list' & 'pages_manage_posts', then click 'Generate Access Token'.`
          );
        }
      }
    } catch (permErr: any) {
      if (permErr?.message && permErr.message.includes("Token is missing")) {
        throw permErr;
      }
    }
  }

  return rawPages.map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category || "Company",
    accessToken: p.access_token,
    fanCount: p.fan_count,
    instagramBusinessAccount: p.instagram_business_account
      ? {
          id: p.instagram_business_account.id,
          username: p.instagram_business_account.username,
          name: p.instagram_business_account.name,
        }
      : undefined,
  }));
}
