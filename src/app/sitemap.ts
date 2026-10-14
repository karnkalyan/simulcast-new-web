import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getServices, getProjects, getPosts } from "@/lib/data";
import { softwareCapabilities } from "@/lib/software-catalog";
import { guides } from "@/lib/editorial";
import { siteServices } from "@/lib/site-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Core high-priority landing and category pages
  const basic: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/solutions`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/software`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/insights`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/brand-assets`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [dbServices, dbProjects, dbPosts] = await Promise.all([
    getServices().catch(() => []),
    getProjects().catch(() => []),
    getPosts().catch(() => []),
  ]);

  // Solutions dynamic URLs
  const solutionSlugs = Array.from(new Set([...siteServices.map((x) => x.slug), ...dbServices.map((x) => x.slug)]));
  const solutions: MetadataRoute.Sitemap = solutionSlugs.map((slug) => ({
    url: `${SITE_URL}/solutions/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // Software & Systems Capabilities (broadcasting, OSS/BSS, AI agentic, media server, mobile apps, etc.)
  const software: MetadataRoute.Sitemap = softwareCapabilities.map((c) => ({
    url: `${SITE_URL}/software/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // Projects & Case Studies
  const projects: MetadataRoute.Sitemap = dbProjects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  // Insights / Articles / Technical Guides
  const postSlugs = Array.from(new Set([...guides.map((g) => g.slug), ...dbPosts.map((p) => p.slug)]));
  const insights: MetadataRoute.Sitemap = postSlugs.map((slug) => ({
    url: `${SITE_URL}/insights/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...basic, ...solutions, ...software, ...projects, ...insights];
}
