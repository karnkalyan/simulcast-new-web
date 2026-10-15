import { prisma } from "@/lib/db";
import { customRouteSchema } from "@/lib/validators";
import fs from "fs";
import path from "path";

export interface CustomRouteRecord {
  id: string;
  path: string;
  name: string;
  description: string;
  method: string;
  contentType: string;
  statusCode: number;
  responseBody: string;
  headers: string | null;
  enabled: boolean;
  hitCount: number;
  lastHitAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FALLBACK_FILE_PATH = path.join(process.cwd(), "data", "custom-routes.json");

const DEFAULT_NEXUS_BODY = JSON.stringify(
  {
    init_url: "https://nexus.tvtoday.com.np/api/init_device.php",
    device_url: "https://nexus.tvtoday.com.np/device.php",
    pvt_init_url: "http://192.168.5.208/nexus/api/init_device.php",
    pvt_device_url: "http://192.168.5.208/nexus/device.php"
  },
  null,
  2
);

const DEFAULT_ROUTES: CustomRouteRecord[] = [
  {
    id: "route_nexus_php",
    path: "/api/nexus.php",
    name: "Nexus Device Endpoints",
    description: "Production and private endpoints for Nexus TV Today (returns dynamic init & device URLs)",
    method: "ALL",
    contentType: "application/json",
    statusCode: 200,
    responseBody: DEFAULT_NEXUS_BODY,
    headers: JSON.stringify({ "Access-Control-Allow-Origin": "*" }, null, 2),
    enabled: true,
    hitCount: 0,
    lastHitAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "route_app_url_php",
    path: "/api/app_url.php",
    name: "Nexus App URL Endpoint",
    description: "PHP endpoint compatible URL returning device endpoints for applications",
    method: "ALL",
    contentType: "application/json",
    statusCode: 200,
    responseBody: DEFAULT_NEXUS_BODY,
    headers: JSON.stringify({ "Access-Control-Allow-Origin": "*" }, null, 2),
    enabled: true,
    hitCount: 0,
    lastHitAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

function readFallbackRoutes(): CustomRouteRecord[] {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const raw = fs.readFileSync(FALLBACK_FILE_PATH, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list.map(item => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          lastHitAt: item.lastHitAt ? new Date(item.lastHitAt) : null
        }));
      }
    }
  } catch (err) {
    console.error("[custom-routes] Error reading fallback file:", err);
  }
  // If not found or empty, save default routes
  writeFallbackRoutes(DEFAULT_ROUTES);
  return DEFAULT_ROUTES;
}

function writeFallbackRoutes(routes: CustomRouteRecord[]) {
  try {
    const dir = path.dirname(FALLBACK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(routes, null, 2), "utf-8");
  } catch (err) {
    console.error("[custom-routes] Error writing fallback file:", err);
  }
}

// In-memory cache for ultra-fast lookup (expires every 30s or on update)
let memoryCache: { routes: CustomRouteRecord[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10000;

export function invalidateRoutesCache() {
  memoryCache = null;
}

// Dynamic delegate helper to ensure clean execution and avoid language server sync delays
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => (prisma as any).customRoute;

export async function listCustomRoutes(): Promise<CustomRouteRecord[]> {
  try {
    const dbRoutes = await getDb().findMany({
      orderBy: { createdAt: "desc" }
    });

    if (dbRoutes.length === 0) {
      // Seed default routes if empty in DB
      for (const def of DEFAULT_ROUTES) {
        await getDb().upsert({
          where: { path: def.path },
          update: {},
          create: {
            path: def.path,
            name: def.name,
            description: def.description,
            method: def.method,
            contentType: def.contentType,
            statusCode: def.statusCode,
            responseBody: def.responseBody,
            headers: def.headers,
            enabled: def.enabled
          }
        }).catch(() => {});
      }
      const refreshed = await getDb().findMany({
        orderBy: { createdAt: "desc" }
      });
      writeFallbackRoutes(refreshed);
      return refreshed;
    }

    writeFallbackRoutes(dbRoutes);
    return dbRoutes;
  } catch {
    // Database unavailable, use fallback file
    return readFallbackRoutes();
  }
}

export async function getCustomRouteByPath(rawPath: string, method?: string): Promise<CustomRouteRecord | null> {
  const cleanPath = (rawPath || "").split("?")[0].trim().toLowerCase();
  const now = Date.now();

  let routes: CustomRouteRecord[];
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    routes = memoryCache.routes;
  } else {
    routes = await listCustomRoutes();
    memoryCache = { routes, timestamp: now };
  }

  const reqMethod = (method || "GET").toUpperCase();

  const match = routes.find(r => {
    if (!r.enabled) return false;
    const rPath = r.path.trim().toLowerCase();
    const pathMatch = rPath === cleanPath;
    if (!pathMatch) return false;
    if (r.method === "ALL") return true;
    return r.method.toUpperCase() === reqMethod;
  });

  return match || null;
}

export async function createCustomRoute(input: unknown): Promise<CustomRouteRecord> {
  const parsed = customRouteSchema.parse(input);
  invalidateRoutesCache();

  try {
    const created = await getDb().create({
      data: {
        path: parsed.path,
        name: parsed.name,
        description: parsed.description,
        method: parsed.method,
        contentType: parsed.contentType,
        statusCode: parsed.statusCode,
        responseBody: parsed.responseBody,
        headers: parsed.headers || null,
        enabled: parsed.enabled
      }
    });
    return created;
  } catch (dbError) {
    // If DB unavailable or duplicate, handle fallback
    const routes = readFallbackRoutes();
    if (routes.some(r => r.path.toLowerCase() === parsed.path.toLowerCase())) {
      throw new Error(`Route with path "${parsed.path}" already exists`);
    }
    const newRoute: CustomRouteRecord = {
      id: "route_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      path: parsed.path,
      name: parsed.name,
      description: parsed.description,
      method: parsed.method,
      contentType: parsed.contentType,
      statusCode: parsed.statusCode,
      responseBody: parsed.responseBody,
      headers: parsed.headers || null,
      enabled: parsed.enabled,
      hitCount: 0,
      lastHitAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    routes.unshift(newRoute);
    writeFallbackRoutes(routes);
    return newRoute;
  }
}

export async function updateCustomRoute(id: string, input: unknown): Promise<CustomRouteRecord> {
  const parsed = customRouteSchema.parse(input);
  invalidateRoutesCache();

  try {
    const updated = await getDb().update({
      where: { id },
      data: {
        path: parsed.path,
        name: parsed.name,
        description: parsed.description,
        method: parsed.method,
        contentType: parsed.contentType,
        statusCode: parsed.statusCode,
        responseBody: parsed.responseBody,
        headers: parsed.headers || null,
        enabled: parsed.enabled
      }
    });
    return updated;
  } catch {
    const routes = readFallbackRoutes();
    const idx = routes.findIndex(r => r.id === id);
    if (idx === -1) throw new Error("Route not found");
    routes[idx] = {
      ...routes[idx],
      path: parsed.path,
      name: parsed.name,
      description: parsed.description,
      method: parsed.method,
      contentType: parsed.contentType,
      statusCode: parsed.statusCode,
      responseBody: parsed.responseBody,
      headers: parsed.headers || null,
      enabled: parsed.enabled,
      updatedAt: new Date()
    };
    writeFallbackRoutes(routes);
    return routes[idx];
  }
}

export async function deleteCustomRoute(id: string): Promise<boolean> {
  invalidateRoutesCache();
  try {
    await getDb().delete({ where: { id } });
    return true;
  } catch {
    const routes = readFallbackRoutes();
    const filtered = routes.filter(r => r.id !== id);
    writeFallbackRoutes(filtered);
    return true;
  }
}

export async function toggleCustomRoute(id: string): Promise<CustomRouteRecord> {
  invalidateRoutesCache();
  try {
    const cur = await getDb().findUnique({ where: { id } });
    if (!cur) throw new Error("Route not found");
    const updated = await getDb().update({
      where: { id },
      data: { enabled: !cur.enabled }
    });
    return updated;
  } catch {
    const routes = readFallbackRoutes();
    const r = routes.find(item => item.id === id);
    if (!r) throw new Error("Route not found");
    r.enabled = !r.enabled;
    r.updatedAt = new Date();
    writeFallbackRoutes(routes);
    return r;
  }
}

export async function recordCustomRouteHit(id: string): Promise<void> {
  try {
    await getDb().update({
      where: { id },
      data: {
        hitCount: { increment: 1 },
        lastHitAt: new Date()
      }
    });
  } catch {
    // Non-blocking fallback hit tracking
    try {
      const routes = readFallbackRoutes();
      const r = routes.find(item => item.id === id);
      if (r) {
        r.hitCount = (r.hitCount || 0) + 1;
        r.lastHitAt = new Date();
        writeFallbackRoutes(routes);
      }
    } catch {}
  }
}

