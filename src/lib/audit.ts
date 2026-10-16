import { prisma } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface AuditLogEntry {
  id: string;
  action: string;
  category: "MCP" | "EMAIL" | "INSIGHTS" | "MEDIA" | "AUTH" | "SETTINGS" | "SYSTEM";
  actor: string;
  target?: string;
  details?: string;
  ipAddress?: string;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
}

const AUDIT_FILE = path.join(process.cwd(), "data", "audit-logs.json");

async function ensureFileExists() {
  try {
    const dir = path.dirname(AUDIT_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.access(AUDIT_FILE);
  } catch {
    await fs.writeFile(AUDIT_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readFallbackAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    await ensureFileExists();
    const data = await fs.readFile(AUDIT_FILE, "utf-8");
    return JSON.parse(data) as AuditLogEntry[];
  } catch {
    return [];
  }
}

async function writeFallbackAuditLogs(logs: AuditLogEntry[]): Promise<void> {
  try {
    await ensureFileExists();
    // Keep last 1000 entries in JSON file
    const trimmed = logs.slice(0, 1000);
    await fs.writeFile(AUDIT_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AuditLog File Write Warning]", err);
  }
}

export async function logAudit({
  action,
  category = "MCP",
  actor = "system",
  target,
  details,
  ipAddress,
  status = "SUCCESS",
}: {
  action: string;
  category?: "MCP" | "EMAIL" | "INSIGHTS" | "MEDIA" | "AUTH" | "SETTINGS" | "SYSTEM";
  actor?: string;
  target?: string;
  details?: string;
  ipAddress?: string;
  status?: "SUCCESS" | "FAILED";
}): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `audit_${randomUUID()}`,
    action,
    category,
    actor,
    target,
    details: typeof details === "object" ? JSON.stringify(details) : details,
    ipAddress,
    status,
    createdAt: new Date().toISOString(),
  };

  // Try Prisma first
  try {
    const dbRecord = await (prisma as any).auditLog.create({
      data: {
        action: entry.action,
        category: entry.category,
        actor: entry.actor,
        target: entry.target || "",
        details: entry.details || "",
        ipAddress: entry.ipAddress || "",
        status: entry.status,
      },
    });
    entry.id = dbRecord.id;
  } catch {
    // Database unreachable; seamlessly append to JSON fallback
    const fallbackList = await readFallbackAuditLogs();
    fallbackList.unshift(entry);
    await writeFallbackAuditLogs(fallbackList);
  }

  return entry;
}

export async function getAuditLogs(options?: {
  limit?: number;
  category?: string;
  search?: string;
}): Promise<AuditLogEntry[]> {
  const limit = options?.limit || 100;
  const category = options?.category?.toUpperCase();
  const search = options?.search?.toLowerCase();

  try {
    const where: Record<string, unknown> = {};
    if (category && category !== "ALL") {
      where.category = category;
    }
    const dbLogs = await (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (dbLogs && dbLogs.length > 0) {
      let mapped: AuditLogEntry[] = dbLogs.map((l: any) => ({
        id: l.id,
        action: l.action,
        category: l.category as AuditLogEntry["category"],
        actor: l.actor,
        target: l.target || undefined,
        details: l.details || undefined,
        ipAddress: l.ipAddress || undefined,
        status: l.status as "SUCCESS" | "FAILED",
        createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
      }));

      if (search) {
        mapped = mapped.filter(
          (l: AuditLogEntry) =>
            l.action.toLowerCase().includes(search) ||
            l.actor.toLowerCase().includes(search) ||
            (l.target && l.target.toLowerCase().includes(search)) ||
            (l.details && l.details.toLowerCase().includes(search))
        );
      }
      return mapped;
    }
  } catch {
    // DB unreachable, read file
  }

  let list = await readFallbackAuditLogs();
  if (category && category !== "ALL") {
    list = list.filter((l) => l.category === category);
  }
  if (search) {
    list = list.filter(
      (l) =>
        l.action.toLowerCase().includes(search) ||
        l.actor.toLowerCase().includes(search) ||
        (l.target && l.target.toLowerCase().includes(search)) ||
        (l.details && l.details.toLowerCase().includes(search))
    );
  }
  return list.slice(0, limit);
}
