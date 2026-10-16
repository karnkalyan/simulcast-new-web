import { prisma } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { sendEmail, type EmailAttachment } from "@/lib/email";
import { logAudit } from "@/lib/audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export type QueueItemStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED";

export interface QueueEmailInput {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  priority?: number;
  scheduledAt?: string | Date;
  batchId?: string;
  source?: string;
  clientIdentity?: string;
}

export interface StoredQueueItem {
  id: string;
  to: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  html: string;
  text?: string | null;
  attachments?: string | null; // JSON string of EmailAttachment[]
  status: QueueItemStatus;
  attempts: number;
  maxAttempts: number;
  priority: number;
  batchId?: string | null;
  source: string;
  scheduledAt: string;
  sentAt?: string | null;
  failedAt?: string | null;
  lastError?: string | null;
  messageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredEmailLog {
  id: string;
  queueItemId?: string | null;
  to: string;
  subject: string;
  status: "SENT" | "FAILED" | "QUEUED";
  source: string;
  messageId?: string | null;
  error?: string | null;
  hasAttachments: boolean;
  attachmentNames?: string | null;
  clientIdentity?: string | null;
  createdAt: string;
}

const QUEUE_FILE = path.join(process.cwd(), "data", "email-queue.json");
const LOGS_FILE = path.join(process.cwd(), "data", "email-logs.json");
const ATTACHMENTS_DIR = path.join(process.cwd(), "public", "uploads", "email-attachments");

async function ensureFile(filePath: string) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readFallbackQueue(): Promise<StoredQueueItem[]> {
  try {
    await ensureFile(QUEUE_FILE);
    const data = await fs.readFile(QUEUE_FILE, "utf-8");
    return JSON.parse(data) as StoredQueueItem[];
  } catch {
    return [];
  }
}

async function writeFallbackQueue(items: StoredQueueItem[]): Promise<void> {
  try {
    await ensureFile(QUEUE_FILE);
    await fs.writeFile(QUEUE_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.warn("[EmailQueue File Write Warning]", err);
  }
}

async function readFallbackLogs(): Promise<StoredEmailLog[]> {
  try {
    await ensureFile(LOGS_FILE);
    const data = await fs.readFile(LOGS_FILE, "utf-8");
    return JSON.parse(data) as StoredEmailLog[];
  } catch {
    return [];
  }
}

async function writeFallbackLogs(logs: StoredEmailLog[]): Promise<void> {
  try {
    await ensureFile(LOGS_FILE);
    const trimmed = logs.slice(0, 2000);
    await fs.writeFile(LOGS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.warn("[EmailLog File Write Warning]", err);
  }
}

/**
 * Normalizes attachments: if base64 content is passed, save it to disk to prevent database overflow.
 */
export async function normalizeAttachments(attachments?: EmailAttachment[]): Promise<EmailAttachment[]> {
  if (!attachments || attachments.length === 0) return [];
  await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });

  const processed: EmailAttachment[] = [];
  for (const att of attachments) {
    if (att.content && typeof att.content === "string" && (att.content.length > 500 || att.content.startsWith("data:"))) {
      let base64Data = att.content;
      if (base64Data.startsWith("data:")) {
        const commaIdx = base64Data.indexOf(",");
        if (commaIdx !== -1) {
          base64Data = base64Data.slice(commaIdx + 1);
        }
      }
      try {
        const fileExt = path.extname(att.filename) || ".bin";
        const safeName = `${randomUUID()}${fileExt}`;
        const filePath = path.join(ATTACHMENTS_DIR, safeName);
        const buf = Buffer.from(base64Data, "base64");
        await fs.writeFile(filePath, buf);

        processed.push({
          filename: att.filename,
          path: `/uploads/email-attachments/${safeName}`,
          contentType: att.contentType,
        });
        continue;
      } catch (err) {
        console.warn("[Attachment Save Error]", err);
      }
    }
    processed.push(att);
  }
  return processed;
}

/**
 * Log an email event to database and fallback log file
 */
export async function recordEmailLog(log: Omit<StoredEmailLog, "id" | "createdAt">): Promise<StoredEmailLog> {
  const fullLog: StoredEmailLog = {
    id: `elog_${randomUUID()}`,
    ...log,
    createdAt: new Date().toISOString(),
  };

  try {
    const dbRecord = await db.emailLog.create({
      data: {
        queueItemId: fullLog.queueItemId || undefined,
        to: fullLog.to,
        subject: fullLog.subject,
        status: fullLog.status,
        source: fullLog.source,
        messageId: fullLog.messageId || undefined,
        error: fullLog.error || undefined,
        hasAttachments: fullLog.hasAttachments,
        attachmentNames: fullLog.attachmentNames || undefined,
        clientIdentity: fullLog.clientIdentity || undefined,
      },
    });
    fullLog.id = dbRecord.id;
  } catch {
    const logs = await readFallbackLogs();
    logs.unshift(fullLog);
    await writeFallbackLogs(logs);
  }

  return fullLog;
}

/**
 * Add a single email to the queue
 */
export async function enqueueEmail(input: QueueEmailInput): Promise<StoredQueueItem> {
  const normalizedAtts = await normalizeAttachments(input.attachments);
  const toStr = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  const ccStr = input.cc ? (Array.isArray(input.cc) ? input.cc.join(", ") : input.cc) : null;
  const bccStr = input.bcc ? (Array.isArray(input.bcc) ? input.bcc.join(", ") : input.bcc) : null;
  const scheduled = input.scheduledAt ? new Date(input.scheduledAt) : new Date();

  const item: StoredQueueItem = {
    id: `queue_${randomUUID()}`,
    to: toStr,
    cc: ccStr,
    bcc: bccStr,
    subject: input.subject,
    html: input.html,
    text: input.text || null,
    attachments: normalizedAtts.length > 0 ? JSON.stringify(normalizedAtts) : null,
    status: "PENDING",
    attempts: 0,
    maxAttempts: 3,
    priority: typeof input.priority === "number" ? input.priority : 0,
    batchId: input.batchId || null,
    source: input.source || "MCP",
    scheduledAt: scheduled.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const dbItem = await db.emailQueueItem.create({
      data: {
        to: item.to,
        cc: item.cc,
        bcc: item.bcc,
        subject: item.subject,
        html: item.html,
        text: item.text,
        attachments: item.attachments,
        status: "PENDING",
        attempts: 0,
        maxAttempts: 3,
        priority: item.priority,
        batchId: item.batchId,
        source: item.source,
        scheduledAt: scheduled,
      },
    });
    item.id = dbItem.id;
  } catch {
    const queue = await readFallbackQueue();
    queue.push(item);
    await writeFallbackQueue(queue);
  }

  await recordEmailLog({
    queueItemId: item.id,
    to: item.to,
    subject: item.subject,
    status: "QUEUED",
    source: item.source,
    hasAttachments: normalizedAtts.length > 0,
    attachmentNames: normalizedAtts.map((a) => a.filename).join(", "),
    clientIdentity: input.clientIdentity || item.source,
  });

  return item;
}

/**
 * Enqueue bulk emails (e.g. 100 recipients).
 * Supports variable replacement: {{email}}, {{name}}, etc.
 */
export async function enqueueBulkEmails({
  recipients,
  subject,
  html,
  text,
  attachments,
  batchName,
  source = "MCP",
  clientIdentity = "MCP Client",
  priority = 0,
}: {
  recipients: Array<string | { email: string; name?: string; vars?: Record<string, string> }>;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  batchName?: string;
  source?: string;
  clientIdentity?: string;
  priority?: number;
}): Promise<{
  batchId: string;
  totalQueued: number;
  recipientsCount: number;
  status: string;
}> {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const normalizedAtts = await normalizeAttachments(attachments);

  let queuedCount = 0;
  for (const r of recipients) {
    const email = typeof r === "string" ? r.trim() : r.email.trim();
    const name = typeof r === "string" ? "" : r.name || "";
    if (!email) continue;

    // Template variables
    let finalSubject = subject.replace(/{{email}}/g, email).replace(/{{name}}/g, name || email);
    let finalHtml = html.replace(/{{email}}/g, email).replace(/{{name}}/g, name || email);
    let finalText = text ? text.replace(/{{email}}/g, email).replace(/{{name}}/g, name || email) : undefined;

    if (typeof r !== "string" && r.vars) {
      for (const [k, v] of Object.entries(r.vars)) {
        const regex = new RegExp(`{{${k}}}`, "g");
        finalSubject = finalSubject.replace(regex, v);
        finalHtml = finalHtml.replace(regex, v);
        if (finalText) finalText = finalText.replace(regex, v);
      }
    }

    await enqueueEmail({
      to: email,
      subject: finalSubject,
      html: finalHtml,
      text: finalText,
      attachments: normalizedAtts,
      priority,
      batchId: batchName ? `${batchName}_${batchId}` : batchId,
      source,
      clientIdentity,
    });
    queuedCount++;
  }

  await logAudit({
    action: "EMAIL_BULK_QUEUED",
    category: "EMAIL",
    actor: clientIdentity || source,
    target: `${queuedCount} recipients`,
    details: `Batch "${batchName || batchId}" with subject "${subject}"`,
    status: "SUCCESS",
  });

  return {
    batchId: batchName ? `${batchName}_${batchId}` : batchId,
    totalQueued: queuedCount,
    recipientsCount: recipients.length,
    status: "QUEUED",
  };
}

/**
 * Process queue: takes up to `limit` pending items, sends them, and updates statuses.
 */
export async function processEmailQueue(limit = 25): Promise<{
  processed: number;
  sent: number;
  failed: number;
  results: Array<{ id: string; to: string; status: "SENT" | "FAILED"; messageId?: string; error?: string }>;
}> {
  const now = new Date();
  let itemsToProcess: StoredQueueItem[] = [];

  // Try DB first
  try {
    const dbItems = await db.emailQueueItem.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: now },
      },
      orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
      take: limit,
    });

    if (dbItems && dbItems.length > 0) {
      itemsToProcess = dbItems.map((i: any) => ({
        id: i.id,
        to: i.to,
        cc: i.cc,
        bcc: i.bcc,
        subject: i.subject,
        html: i.html,
        text: i.text,
        attachments: i.attachments,
        status: i.status as QueueItemStatus,
        attempts: i.attempts,
        maxAttempts: i.maxAttempts,
        priority: i.priority,
        batchId: i.batchId,
        source: i.source,
        scheduledAt: i.scheduledAt instanceof Date ? i.scheduledAt.toISOString() : String(i.scheduledAt),
        sentAt: i.sentAt ? (i.sentAt instanceof Date ? i.sentAt.toISOString() : String(i.sentAt)) : null,
        failedAt: i.failedAt ? (i.failedAt instanceof Date ? i.failedAt.toISOString() : String(i.failedAt)) : null,
        lastError: i.lastError,
        messageId: i.messageId,
        createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
        updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : String(i.updatedAt),
      }));

      // Mark as PROCESSING
      await db.emailQueueItem.updateMany({
        where: { id: { in: itemsToProcess.map((i) => i.id) } },
        data: { status: "PROCESSING", updatedAt: now },
      });
    }
  } catch {
    // DB unreachable, check fallback file
    const queue = await readFallbackQueue();
    itemsToProcess = queue
      .filter((i) => i.status === "PENDING" && new Date(i.scheduledAt) <= now)
      .sort((a, b) => b.priority - a.priority || new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, limit);

    for (const item of itemsToProcess) {
      item.status = "PROCESSING";
      item.updatedAt = now.toISOString();
    }
    await writeFallbackQueue(queue);
  }

  const results: Array<{ id: string; to: string; status: "SENT" | "FAILED"; messageId?: string; error?: string }> = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const item of itemsToProcess) {
    let attachments: EmailAttachment[] = [];
    if (item.attachments) {
      try {
        attachments = JSON.parse(item.attachments);
      } catch {}
    }

    const sendRes = await sendEmail({
      to: item.to,
      cc: item.cc || undefined,
      bcc: item.bcc || undefined,
      subject: item.subject,
      html: item.html,
      text: item.text || undefined,
      attachments,
    });

    const isSent = sendRes.ok;
    const newAttempts = item.attempts + 1;
    const finalStatus: QueueItemStatus = isSent
      ? "SENT"
      : newAttempts >= item.maxAttempts
      ? "FAILED"
      : "PENDING";

    if (isSent) {
      sentCount++;
      results.push({ id: item.id, to: item.to, status: "SENT", messageId: sendRes.messageId });
    } else {
      failedCount++;
      results.push({ id: item.id, to: item.to, status: "FAILED", error: sendRes.error });
    }

    // Update record
    try {
      await db.emailQueueItem.update({
        where: { id: item.id },
        data: {
          status: finalStatus,
          attempts: newAttempts,
          sentAt: isSent ? new Date() : undefined,
          failedAt: !isSent ? new Date() : undefined,
          lastError: sendRes.error || null,
          messageId: sendRes.messageId || null,
          updatedAt: new Date(),
        },
      });
    } catch {
      const queue = await readFallbackQueue();
      const match = queue.find((q) => q.id === item.id);
      if (match) {
        match.status = finalStatus;
        match.attempts = newAttempts;
        match.sentAt = isSent ? new Date().toISOString() : null;
        match.failedAt = !isSent ? new Date().toISOString() : null;
        match.lastError = sendRes.error || null;
        match.messageId = sendRes.messageId || null;
        match.updatedAt = new Date().toISOString();
        await writeFallbackQueue(queue);
      }
    }

    // Update / Record Email Log
    await recordEmailLog({
      queueItemId: item.id,
      to: item.to,
      subject: item.subject,
      status: isSent ? "SENT" : "FAILED",
      source: item.source,
      messageId: sendRes.messageId,
      error: sendRes.error,
      hasAttachments: attachments.length > 0,
      attachmentNames: attachments.map((a) => a.filename).join(", "),
      clientIdentity: item.source,
    });
  }

  if (itemsToProcess.length > 0) {
    await logAudit({
      action: "EMAIL_QUEUE_PROCESSED",
      category: "EMAIL",
      actor: "Queue Processor",
      details: `Processed ${itemsToProcess.length} items: ${sentCount} sent, ${failedCount} failed`,
      status: failedCount > 0 ? "FAILED" : "SUCCESS",
    });
  }

  return {
    processed: itemsToProcess.length,
    sent: sentCount,
    failed: failedCount,
    results,
  };
}

/**
 * Get queue status & items
 */
export async function getEmailQueue(options?: {
  status?: string;
  batchId?: string;
  limit?: number;
}): Promise<{
  stats: { total: number; pending: number; processing: number; sent: number; failed: number };
  items: StoredQueueItem[];
}> {
  const limit = options?.limit || 100;
  const statusFilter = options?.status?.toUpperCase();
  const batchFilter = options?.batchId;

  let allItems: StoredQueueItem[] = [];

  try {
    const dbItems = await db.emailQueueItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    if (dbItems && dbItems.length > 0) {
      allItems = dbItems.map((i: any) => ({
        id: i.id,
        to: i.to,
        cc: i.cc,
        bcc: i.bcc,
        subject: i.subject,
        html: i.html,
        text: i.text,
        attachments: i.attachments,
        status: i.status as QueueItemStatus,
        attempts: i.attempts,
        maxAttempts: i.maxAttempts,
        priority: i.priority,
        batchId: i.batchId,
        source: i.source,
        scheduledAt: i.scheduledAt instanceof Date ? i.scheduledAt.toISOString() : String(i.scheduledAt),
        sentAt: i.sentAt ? (i.sentAt instanceof Date ? i.sentAt.toISOString() : String(i.sentAt)) : null,
        failedAt: i.failedAt ? (i.failedAt instanceof Date ? i.failedAt.toISOString() : String(i.failedAt)) : null,
        lastError: i.lastError,
        messageId: i.messageId,
        createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
        updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : String(i.updatedAt),
      }));
    }
  } catch {
    allItems = await readFallbackQueue();
  }

  const stats = {
    total: allItems.length,
    pending: allItems.filter((i) => i.status === "PENDING").length,
    processing: allItems.filter((i) => i.status === "PROCESSING").length,
    sent: allItems.filter((i) => i.status === "SENT").length,
    failed: allItems.filter((i) => i.status === "FAILED").length,
  };

  let filtered = allItems;
  if (statusFilter && statusFilter !== "ALL") {
    filtered = filtered.filter((i) => i.status === statusFilter);
  }
  if (batchFilter) {
    filtered = filtered.filter((i) => i.batchId && i.batchId.includes(batchFilter));
  }

  return {
    stats,
    items: filtered.slice(0, limit),
  };
}

/**
 * Get Email Logs
 */
export async function getEmailLogs(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<StoredEmailLog[]> {
  const limit = options?.limit || 100;
  const status = options?.status?.toUpperCase();
  const search = options?.search?.toLowerCase();

  try {
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;

    const dbLogs = await db.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (dbLogs && dbLogs.length > 0) {
      let mapped: StoredEmailLog[] = dbLogs.map((l: any) => ({
        id: l.id,
        queueItemId: l.queueItemId,
        to: l.to,
        subject: l.subject,
        status: l.status as "SENT" | "FAILED" | "QUEUED",
        source: l.source,
        messageId: l.messageId,
        error: l.error,
        hasAttachments: l.hasAttachments,
        attachmentNames: l.attachmentNames,
        clientIdentity: l.clientIdentity,
        createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
      }));

      if (search) {
        mapped = mapped.filter(
          (l: StoredEmailLog) =>
            l.to.toLowerCase().includes(search) ||
            l.subject.toLowerCase().includes(search) ||
            (l.messageId && l.messageId.toLowerCase().includes(search))
        );
      }
      return mapped;
    }
  } catch {}

  let logs = await readFallbackLogs();
  if (status && status !== "ALL") {
    logs = logs.filter((l) => l.status === status);
  }
  if (search) {
    logs = logs.filter(
      (l) =>
        l.to.toLowerCase().includes(search) ||
        l.subject.toLowerCase().includes(search) ||
        (l.messageId && l.messageId.toLowerCase().includes(search))
    );
  }
  return logs.slice(0, limit);
}

/**
 * Retry failed items
 */
export async function retryFailedEmails(targetId?: string): Promise<{ retried: number }> {
  let count = 0;
  try {
    const where = targetId
      ? { id: targetId, status: "FAILED" as const }
      : { status: "FAILED" as const };
    const res = await db.emailQueueItem.updateMany({
      where,
      data: { status: "PENDING", attempts: 0, lastError: null },
    });
    count = res.count;
  } catch {
    const queue = await readFallbackQueue();
    for (const item of queue) {
      if ((!targetId || item.id === targetId) && item.status === "FAILED") {
        item.status = "PENDING";
        item.attempts = 0;
        item.lastError = null;
        count++;
      }
    }
    await writeFallbackQueue(queue);
  }

  await logAudit({
    action: "EMAIL_QUEUE_RETRY",
    category: "EMAIL",
    actor: "Admin / MCP",
    details: `Reset ${count} failed emails back to PENDING`,
    status: "SUCCESS",
  });

  return { retried: count };
}

/**
 * Clear queue
 */
export async function clearEmailQueue(status?: "SENT" | "FAILED" | "ALL"): Promise<{ cleared: number }> {
  let count = 0;
  try {
    const where = !status || status === "ALL" ? {} : { status };
    const res = await db.emailQueueItem.deleteMany({ where });
    count = res.count;
  } catch {
    let queue = await readFallbackQueue();
    const initial = queue.length;
    if (!status || status === "ALL") {
      queue = [];
    } else {
      queue = queue.filter((i) => i.status !== status);
    }
    count = initial - queue.length;
    await writeFallbackQueue(queue);
  }

  await logAudit({
    action: "EMAIL_QUEUE_CLEARED",
    category: "EMAIL",
    actor: "Admin / MCP",
    details: `Cleared ${count} items from queue (filter: ${status || "ALL"})`,
    status: "SUCCESS",
  });

  return { cleared: count };
}
