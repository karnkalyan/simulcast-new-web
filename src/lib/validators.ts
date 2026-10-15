import {z} from "zod";
export const slug = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"Use lowercase letters, digits and hyphens");
export const inquirySchema=z.object({name:z.string().trim().min(2).max(100),email:z.email().max(191),organization:z.string().trim().max(120).default(""),phone:z.string().trim().max(40).default(""),interest:z.string().trim().max(120).default(""),message:z.string().trim().min(10).max(5000),timeline:z.string().trim().max(50).default("Flexible"),preferredContact:z.string().trim().max(50).default("Email"),consent:z.literal("yes"),website:z.string().max(1).default("")});
export const settingsSchema=z.object({
  companyName:z.string().min(2).max(120),
  headline:z.string().min(8).max(180),
  subheadline:z.string().min(12).max(1200),
  slogan:z.string().min(4).max(130),
  website:z.union([z.string().url(), z.string()]).default("https://www.simulcast.com.np"),
  publicEmail:z.union([z.literal(""),z.string()]).default(""),
  phone:z.string().max(50).default(""),
  address:z.string().max(300).default("Nepal"),
  facebook:z.string().max(400).default(""),
  linkedin:z.string().max(400).default(""),
  youtube:z.string().max(400).default(""),
  instagram:z.string().max(400).default(""),
  seoDescription:z.string().min(10).max(1000).default(""),
  primaryColor:z.string().max(32).default("#2b0d3a"),
  secondaryColor:z.string().max(32).default("#e11d72"),
  heroBgColor:z.string().max(32).default("#f5f7fd"),
  heroBadgeText:z.string().max(191).default("INTEGRATED TECHNOLOGY · BUILT IN NEPAL"),
  heroEmphasis:z.string().max(191).default("Connected by design."),
  customCss:z.string().nullable().optional(),
  enableChat:z.boolean().default(true),
  chatGreeting:z.string().max(1000).default("Hello! Welcome to Simulcast Technologies."),
  mcpApiKey:z.string().max(255).default("simulcast_master_mcp_api_key_2026_sec"),
  escalationEmail:z.string().max(255).default("info@simulcast.com.np,support@simulcast.com.np"),
  supportEmail:z.string().max(255).default("support@simulcast.com.np"),
}).passthrough();
export const serviceSchema=z.object({slug,title:z.string().min(2).max(130),eyebrow:z.string().max(100).default(""),summary:z.string().min(10).max(600),body:z.string().min(20).max(20000),icon:z.string().max(60).default("layers"),imageUrl:z.string().max(255).default(""),sortOrder:z.coerce.number().int().min(0).max(9999).default(0),published:z.boolean().default(true)});
export const projectSchema=z.object({slug,title:z.string().min(2).max(140),category:z.string().max(100).default("Technology"),summary:z.string().min(10).max(600),body:z.string().min(20).max(20000),imageUrl:z.string().max(255).default(""),location:z.string().max(130).default("Nepal"),featured:z.boolean().default(false),published:z.boolean().default(true),sortOrder:z.coerce.number().int().min(0).max(9999).default(0)});
export const postSchema=z.object({slug,title:z.string().min(2).max(140),category:z.string().max(100).default("Insights"),excerpt:z.string().min(10).max(600),body:z.string().min(30).max(30000),imageUrl:z.string().max(255).default(""),published:z.boolean().default(false)});
export const inquiryUpdateSchema=z.object({status:z.enum(["NEW","IN_PROGRESS","RESPONDED","CLOSED"]),internalNotes:z.string().max(3000)});
export const userSchema=z.object({name:z.string().min(2).max(120),email:z.email().max(191),password:z.string().min(14).max(200),role:z.enum(["ADMIN","EDITOR"]),active:z.boolean().default(true)});
export const customRouteSchema=z.object({
  path: z.string().trim().min(1).max(191).refine(v => v.startsWith("/"), { message: "Path must start with / (e.g. /api/nexus.php)" }),
  name: z.string().trim().min(2).max(191),
  description: z.string().trim().max(255).default(""),
  method: z.enum(["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"]).default("ALL"),
  contentType: z.string().trim().min(1).max(100).default("application/json"),
  statusCode: z.coerce.number().int().min(100).max(599).default(200),
  responseBody: z.string().default("{}"),
  headers: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
});

