"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  RefreshCw,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  Search,
  Filter,
  Plus,
  Eye,
  X,
  Layers,
  FileText,
  AlertCircle,
  Users,
  Inbox,
  Server,
} from "lucide-react";
import AdminWebmail from "./AdminWebmail";

interface QueueItem {
  id: string;
  to: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  html: string;
  text?: string | null;
  attachments?: string | null;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED";
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
}

interface EmailLogItem {
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

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export default function AdminEmailQueue() {
  const [activeTab, setActiveTab] = useState<"webmail" | "accounts" | "queue" | "logs" | "compose">("webmail");

  // Queue state
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({ total: 0, pending: 0, processing: 0, sent: 0, failed: 0 });
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Logs state
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("ALL");

  // Compose / Bulk send state
  const [composeMode, setComposeMode] = useState<"single" | "bulk">("single");
  const [toInput, setToInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [htmlInput, setHtmlInput] = useState("");
  const [priorityInput, setPriorityInput] = useState(0);
  const [batchNameInput, setBatchNameInput] = useState("");
  const [queueImmediately, setQueueImmediately] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<Array<{ filename: string; path?: string; content?: string }>>([]);
  const [uploadingAtt, setUploadingAtt] = useState(false);

  useEffect(() => {
    loadQueue();
    loadLogs();
  }, [statusFilter]);

  async function loadQueue() {
    setLoadingQueue(true);
    try {
      const url = `/api/admin/email-queue?status=${statusFilter}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQueueItems(data.items || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      setActionError("Failed to fetch email queue.");
    } finally {
      setLoadingQueue(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const url = `/api/admin/email-logs?status=${logStatusFilter}&search=${encodeURIComponent(logSearch)}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // error
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleProcessQueue() {
    setActionNotice(null);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/email-queue/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 50 }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice(`Queue run complete: ${data.sent} sent, ${data.failed} failed (${data.processed} total processed).`);
        await loadQueue();
        await loadLogs();
      } else {
        throw new Error(data.error || "Queue process failed");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Process error");
    }
  }

  async function handleRetry(id?: string) {
    try {
      const res = await fetch("/api/admin/email-queue/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setActionNotice(`Reset ${data.retried} failed email(s) to PENDING status.`);
      await loadQueue();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Retry failed");
    }
  }

  async function handleClearQueue(status: "SENT" | "FAILED" | "ALL") {
    if (!confirm(`Are you sure you want to clear ${status.toLowerCase()} emails from the queue?`)) return;
    try {
      const res = await fetch(`/api/admin/email-queue?status=${status}`, { method: "DELETE" });
      const data = await res.json();
      setActionNotice(`Cleared ${data.cleared} records.`);
      await loadQueue();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Clear failed");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAtt(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", `Attachment: ${file.name}`);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const asset = await res.json();
          setSelectedAttachments((prev) => [
            ...prev,
            { filename: file.name, path: asset.path },
          ]);
        }
      }
    } catch {
      setActionError("Attachment upload failed.");
    } finally {
      setUploadingAtt(false);
      e.target.value = "";
    }
  }

  async function handleComposeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionNotice(null);
    setActionError(null);
    setSendingEmail(true);

    try {
      if (composeMode === "single") {
        const res = await fetch("/api/admin/email-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: toInput.trim(),
            subject: subjectInput.trim(),
            html: htmlInput.trim(),
            attachments: selectedAttachments,
            priority: priorityInput,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to enqueue");
        setActionNotice(`Email to ${toInput} successfully queued with ID #${data.item?.id || "N/A"}.`);
      } else {
        // Bulk Mode (up to 100+ emails)
        const rawList = bulkInput
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);

        if (rawList.length === 0) {
          throw new Error("Enter at least one recipient email address.");
        }

        const res = await fetch("/api/admin/email-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isBulk: true,
            recipients: rawList,
            subject: subjectInput.trim(),
            html: htmlInput.trim(),
            attachments: selectedAttachments,
            batchName: batchNameInput.trim() || undefined,
            priority: priorityInput,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Bulk queue failed");
        setActionNotice(`Successfully queued ${data.totalQueued} emails in batch '${data.batchId}'.`);
      }

      // Reset form
      setToInput("");
      setBulkInput("");
      setSubjectInput("");
      setHtmlInput("");
      setSelectedAttachments([]);
      setBatchNameInput("");
      setActiveTab("queue");
      await loadQueue();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Sending failed");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">COMMUNICATIONS / EMAIL & QUEUE ENGINE</div>
          <h1>
            Email Dispatch & Queue Manager<span className="admin-pink">.</span>
          </h1>
          <p>
            Manage outgoing email deliveries, monitor background queues (100+ bulk mail batches), verify attachment dispatches, and review full SMTP logs.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setActiveTab("compose")}
            className="btn btn-pink"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Compose & Bulk Send
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionNotice && <div className="notice-note">{actionNotice}</div>}
      {actionError && <div className="error-note">{actionError}</div>}

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #e8e2ec",
            boxShadow: "0 2px 10px rgba(43, 13, 58, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6d6975", fontSize: 13, marginBottom: 8 }}>
            <span>Total In Queue</span>
            <Layers size={18} color="#2b0d3a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#2b0d3a" }}>{stats.total}</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #e8e2ec",
            boxShadow: "0 2px 10px rgba(43, 13, 58, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6d6975", fontSize: 13, marginBottom: 8 }}>
            <span>Pending Delivery</span>
            <Clock size={18} color="#e11d72" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#e11d72" }}>{stats.pending}</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #e8e2ec",
            boxShadow: "0 2px 10px rgba(43, 13, 58, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6d6975", fontSize: 13, marginBottom: 8 }}>
            <span>Processing</span>
            <RefreshCw size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0284c7" }}>{stats.processing}</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #e8e2ec",
            boxShadow: "0 2px 10px rgba(43, 13, 58, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6d6975", fontSize: 13, marginBottom: 8 }}>
            <span>Delivered (Sent)</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>{stats.sent}</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #e8e2ec",
            boxShadow: "0 2px 10px rgba(43, 13, 58, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6d6975", fontSize: 13, marginBottom: 8 }}>
            <span>Failed Delivery</span>
            <XCircle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#ef4444" }}>{stats.failed}</div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #eee5f0",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("webmail")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 6px",
            fontSize: 14,
            fontWeight: activeTab === "webmail" ? 700 : 500,
            color: activeTab === "webmail" ? "#e11d72" : "#6d6975",
            borderBottom: activeTab === "webmail" ? "3px solid #e11d72" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Inbox size={16} /> Webmail Client
        </button>

        <button
          onClick={() => setActiveTab("accounts")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 6px",
            fontSize: 14,
            fontWeight: activeTab === "accounts" ? 700 : 500,
            color: activeTab === "accounts" ? "#e11d72" : "#6d6975",
            borderBottom: activeTab === "accounts" ? "3px solid #e11d72" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Server size={16} /> Mail Accounts &amp; Server Setup
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 6px",
            fontSize: 14,
            fontWeight: activeTab === "queue" ? 700 : 500,
            color: activeTab === "queue" ? "#e11d72" : "#6d6975",
            borderBottom: activeTab === "queue" ? "3px solid #e11d72" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Clock size={16} /> Live Queue ({stats.pending})
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 6px",
            fontSize: 14,
            fontWeight: activeTab === "logs" ? 700 : 500,
            color: activeTab === "logs" ? "#e11d72" : "#6d6975",
            borderBottom: activeTab === "logs" ? "3px solid #e11d72" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileText size={16} /> Delivery Logs
        </button>

        <button
          onClick={() => setActiveTab("compose")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 6px",
            fontSize: 14,
            fontWeight: activeTab === "compose" ? 700 : 500,
            color: activeTab === "compose" ? "#e11d72" : "#6d6975",
            borderBottom: activeTab === "compose" ? "3px solid #e11d72" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Send size={16} /> Fast Bulk Sender
        </button>
      </div>

      {/* TAB 0: WEBMAIL CLIENT */}
      {activeTab === "webmail" && <AdminWebmail initialView="webmail" />}

      {/* TAB 0.5: ACCOUNTS & SERVER SETUP */}
      {activeTab === "accounts" && <AdminWebmail initialView="accounts" />}

      {/* TAB 1: QUEUE MANAGER */}
      {activeTab === "queue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Action Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              background: "#ffffff",
              padding: "14px 18px",
              borderRadius: 8,
              border: "1px solid #e8e2ec",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Filter size={16} color="#6d6975" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #d5ccd8",
                  fontSize: 13,
                  color: "#2b0d3a",
                  fontWeight: 600,
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Only</option>
                <option value="PROCESSING">Processing</option>
                <option value="SENT">Delivered (Sent)</option>
                <option value="FAILED">Failed</option>
              </select>
              <button
                onClick={loadQueue}
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {stats.pending > 0 && (
                <button
                  onClick={handleProcessQueue}
                  className="btn btn-pink"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px" }}
                >
                  <Send size={15} /> Process Queue Now ({stats.pending})
                </button>
              )}

              {stats.failed > 0 && (
                <button
                  onClick={() => handleRetry()}
                  className="btn btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", color: "#e11d72", borderColor: "#e11d72" }}
                >
                  <RotateCcw size={15} /> Retry All Failed ({stats.failed})
                </button>
              )}

              <button
                onClick={() => handleClearQueue("SENT")}
                className="btn btn-outline"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 12 }}
              >
                Clear Sent
              </button>

              <button
                onClick={() => handleClearQueue("ALL")}
                className="btn btn-outline"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 12, color: "#b91c1c" }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div className="admin-table-shell">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Batch / Source</th>
                    <th>Scheduled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queueItems.map((item) => {
                    const isPending = item.status === "PENDING";
                    const isFailed = item.status === "FAILED";
                    const isSent = item.status === "SENT";

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.to}</strong>
                          {item.cc && <small style={{ display: "block", color: "#8d8795" }}>CC: {item.cc}</small>}
                        </td>
                        <td>
                          <span>{item.subject}</span>
                          {item.attachments && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, color: "#e11d72", fontSize: 11 }}>
                              <Paperclip size={12} /> attachment
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isPending
                                ? "#fff0f7"
                                : isFailed
                                ? "#fee2e2"
                                : isSent
                                ? "#d1fae5"
                                : "#e0f2fe",
                              color: isPending
                                ? "#e11d72"
                                : isFailed
                                ? "#b91c1c"
                                : isSent
                                ? "#065f46"
                                : "#0284c7",
                            }}
                          >
                            {isPending && <Clock size={11} />}
                            {isFailed && <XCircle size={11} />}
                            {isSent && <CheckCircle2 size={11} />}
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.attempts} / {item.maxAttempts}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, background: "#f5f0f7", padding: "3px 6px", borderRadius: 4 }}>
                            {item.batchId ? item.batchId.slice(0, 18) : item.source}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#6d6975" }}>
                          {new Date(item.scheduledAt).toLocaleString()}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button onClick={() => setSelectedItem(item)} title="View Email Details">
                              <Eye size={16} />
                            </button>
                            {isFailed && (
                              <button onClick={() => handleRetry(item.id)} title="Retry Sending">
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!loadingQueue && queueItems.length === 0 && (
                <div className="admin-empty">
                  No queue items matching filter. Ready to dispatch emails via MCP or Compose tab.
                </div>
              )}
              {loadingQueue && <div className="admin-empty">Loading queue...</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL LOGS */}
      {activeTab === "logs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              background: "#ffffff",
              padding: "14px 18px",
              borderRadius: 8,
              border: "1px solid #e8e2ec",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 500 }}>
              <Search size={16} color="#6d6975" />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadLogs()}
                placeholder="Search recipient, subject, or message ID..."
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  borderRadius: 6,
                  border: "1px solid #d5ccd8",
                  fontSize: 13,
                }}
              />
              <button onClick={loadLogs} className="btn btn-outline" style={{ padding: "6px 12px" }}>
                Search
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={logStatusFilter}
                onChange={(e) => {
                  setLogStatusFilter(e.target.value);
                  loadLogs();
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #d5ccd8",
                  fontSize: 13,
                }}
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="SENT">SENT (Success)</option>
                <option value="FAILED">FAILED</option>
                <option value="QUEUED">QUEUED</option>
              </select>
              <button onClick={loadLogs} className="btn btn-outline" style={{ padding: "6px 12px" }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="admin-table-shell">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Message ID / Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isSent = log.status === "SENT";
                    const isFailed = log.status === "FAILED";
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: 12, color: "#6d6975" }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <strong>{log.to}</strong>
                        </td>
                        <td>
                          <span>{log.subject}</span>
                          {log.hasAttachments && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, color: "#e11d72", fontSize: 11 }}>
                              <Paperclip size={12} /> {log.attachmentNames || "attachments"}
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isSent ? "#d1fae5" : isFailed ? "#fee2e2" : "#f3e8ff",
                              color: isSent ? "#065f46" : isFailed ? "#b91c1c" : "#6b21a8",
                            }}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: "#544f5c" }}>
                            {log.clientIdentity || log.source}
                          </span>
                        </td>
                        <td>
                          {log.error ? (
                            <span style={{ color: "#b91c1c", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                              <AlertCircle size={13} /> {log.error.slice(0, 80)}
                            </span>
                          ) : (
                            <code style={{ fontSize: 11, color: "#6d6975" }}>{log.messageId || "—"}</code>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!loadingLogs && logs.length === 0 && (
                <div className="admin-empty">No email logs found. Outgoing emails will appear here.</div>
              )}
              {loadingLogs && <div className="admin-empty">Loading logs...</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPOSE & BULK SEND */}
      {activeTab === "compose" && (
        <div
          style={{
            background: "#ffffff",
            padding: 30,
            borderRadius: 8,
            border: "1px solid #e8e2ec",
            boxShadow: "0 4px 20px rgba(43, 13, 58, 0.05)",
            maxWidth: 850,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "#2b0d3a" }}>
                {composeMode === "single" ? "Compose Email" : "Bulk Email Dispatch (100+ Recipient Queue)"}
              </h3>
              <p style={{ margin: "4px 0 0", color: "#6d6975", fontSize: 13 }}>
                Send through Simulcast SMTP or place in queue for throttled background dispatch.
              </p>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "flex", background: "#f5f0f7", padding: 3, borderRadius: 6 }}>
              <button
                type="button"
                onClick={() => setComposeMode("single")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: composeMode === "single" ? 700 : 500,
                  background: composeMode === "single" ? "#2b0d3a" : "transparent",
                  color: composeMode === "single" ? "#ffffff" : "#6d6975",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Single Recipient
              </button>
              <button
                type="button"
                onClick={() => setComposeMode("bulk")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: composeMode === "bulk" ? 700 : 500,
                  background: composeMode === "bulk" ? "#e11d72" : "transparent",
                  color: composeMode === "bulk" ? "#ffffff" : "#6d6975",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Users size={13} /> Bulk Mode (100+)
              </button>
            </div>
          </div>

          <form onSubmit={handleComposeSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {composeMode === "single" ? (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#2b0d3a", marginBottom: 6 }}>
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="e.g. client@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: "1px solid #d5ccd8",
                    fontSize: 14,
                  }}
                />
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#2b0d3a" }}>
                    Bulk Recipients (Paste 100+ emails, separated by commas or newlines)
                  </label>
                  <span style={{ fontSize: 11, color: "#e11d72", fontWeight: 700 }}>
                    {bulkInput ? bulkInput.split(/[\n,;]+/).filter(Boolean).length : 0} recipients detected
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={`client1@organization.com\nclient2@organization.com\nclient3@organization.com`}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: "1px solid #d5ccd8",
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6d6975" }}>
                  Tip: In the email body, you can use <code>{"{{email}}"}</code> to insert the recipient's address.
                </p>
              </div>
            )}

            {composeMode === "bulk" && (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#2b0d3a", marginBottom: 6 }}>
                  Batch Label (Optional)
                </label>
                <input
                  type="text"
                  value={batchNameInput}
                  onChange={(e) => setBatchNameInput(e.target.value)}
                  placeholder="e.g. product-launch-v6 or newsletter-october"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: "1px solid #d5ccd8",
                    fontSize: 14,
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#2b0d3a", marginBottom: 6 }}>
                Subject
              </label>
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="Important engineering announcement from Simulcast Technologies"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "1px solid #d5ccd8",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#2b0d3a", marginBottom: 6 }}>
                Message Content (HTML Supported)
              </label>
              <textarea
                rows={8}
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder={`<p>Dear Partner,</p>\n<p>We are pleased to introduce our next-generation broadcast playout and AI automation solutions...</p>\n<p>Regards,<br>Simulcast Technologies Team</p>`}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "1px solid #d5ccd8",
                  fontSize: 13,
                  fontFamily: "sans-serif",
                }}
              />
            </div>

            {/* Attachments */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#2b0d3a", marginBottom: 6 }}>
                File Attachments
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                <label className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, padding: "8px 14px" }}>
                  <Paperclip size={15} /> {uploadingAtt ? "Uploading..." : "Attach File (PDF, Image, Docs)"}
                  <input type="file" multiple onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>

              {selectedAttachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedAttachments.map((att, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#f5f0f7",
                        padding: "5px 10px",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "#2b0d3a",
                        border: "1px solid #e1d6e6",
                      }}
                    >
                      <Paperclip size={13} color="#e11d72" />
                      {att.filename}
                      <button
                        type="button"
                        onClick={() => setSelectedAttachments(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8190", padding: 0 }}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Priority & Queue Toggle */}
            <div style={{ display: "flex", gap: 20, alignItems: "center", paddingTop: 8 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#2b0d3a", display: "block", marginBottom: 4 }}>
                  Priority
                </label>
                <select
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(Number(e.target.value))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: "1px solid #d5ccd8",
                    fontSize: 13,
                  }}
                >
                  <option value={0}>Normal (0)</option>
                  <option value={5}>High (5)</option>
                  <option value={10}>Urgent (10)</option>
                </select>
              </div>

              <div style={{ marginTop: 18 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2b0d3a", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={queueImmediately}
                    onChange={(e) => setQueueImmediately(e.target.checked)}
                  />
                  Place into background queue (Safe rate-limited delivery)
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button
                type="submit"
                disabled={sendingEmail}
                className="btn btn-pink"
                style={{ padding: "10px 24px", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}
              >
                <Send size={16} />
                {sendingEmail ? "Dispatching..." : composeMode === "single" ? "Enqueue / Send Email" : "Queue 100+ Bulk Emails"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: View Queue Item Details */}
      {selectedItem && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true" aria-label="Queue item details">
          <div className="cms-modal-scrim" onClick={() => setSelectedItem(null)} />
          <div className="cms-modal" style={{ maxWidth: 650 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">QUEUE ITEM #{selectedItem.id.slice(-8)}</div>
                <h2>{selectedItem.subject}</h2>
              </div>
              <button aria-label="Close" onClick={() => setSelectedItem(null)}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", width: 120, fontWeight: 700 }}>Recipient:</td>
                    <td style={{ padding: "6px 0", color: "#2b0d3a", fontWeight: 700 }}>{selectedItem.to}</td>
                  </tr>
                  {selectedItem.cc && (
                    <tr>
                      <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>CC:</td>
                      <td style={{ padding: "6px 0" }}>{selectedItem.cc}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Status:</td>
                    <td style={{ padding: "6px 0" }}>
                      <strong>{selectedItem.status}</strong> (Attempts: {selectedItem.attempts}/{selectedItem.maxAttempts})
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Source / Batch:</td>
                    <td style={{ padding: "6px 0" }}>{selectedItem.batchId || selectedItem.source}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Scheduled At:</td>
                    <td style={{ padding: "6px 0" }}>{new Date(selectedItem.scheduledAt).toLocaleString()}</td>
                  </tr>
                  {selectedItem.sentAt && (
                    <tr>
                      <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Sent At:</td>
                      <td style={{ padding: "6px 0", color: "#10b981" }}>{new Date(selectedItem.sentAt).toLocaleString()}</td>
                    </tr>
                  )}
                  {selectedItem.messageId && (
                    <tr>
                      <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>SMTP Message ID:</td>
                      <td style={{ padding: "6px 0", fontFamily: "monospace", fontSize: 12 }}>{selectedItem.messageId}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {selectedItem.lastError && (
                <div style={{ background: "#fee2e2", borderLeft: "4px solid #ef4444", padding: "10px 14px", borderRadius: 4 }}>
                  <strong style={{ color: "#b91c1c", fontSize: 12 }}>Delivery Error:</strong>
                  <p style={{ margin: "4px 0 0", color: "#7f1d1d", fontSize: 13 }}>{selectedItem.lastError}</p>
                </div>
              )}

              {/* Email Body Preview */}
              <div>
                <strong style={{ display: "block", fontSize: 13, color: "#2b0d3a", marginBottom: 6 }}>Email Body HTML:</strong>
                <div
                  style={{
                    background: "#f9f8fa",
                    border: "1px solid #e8e2ec",
                    borderRadius: 6,
                    padding: 16,
                    maxHeight: 220,
                    overflowY: "auto",
                    fontSize: 13,
                    color: "#221d27",
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedItem.html }}
                />
              </div>

              {/* Attachments */}
              {selectedItem.attachments && (
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: "#2b0d3a", marginBottom: 6 }}>Attachments:</strong>
                  <div style={{ fontSize: 12, fontFamily: "monospace", background: "#f5f0f7", padding: 10, borderRadius: 4 }}>
                    {selectedItem.attachments}
                  </div>
                </div>
              )}
            </div>

            <div className="cms-modal-actions" style={{ marginTop: 24 }}>
              {selectedItem.status === "FAILED" && (
                <button
                  type="button"
                  className="btn btn-pink"
                  onClick={async () => {
                    await handleRetry(selectedItem.id);
                    setSelectedItem(null);
                  }}
                >
                  <RotateCcw size={15} /> Retry This Email
                </button>
              )}
              <button type="button" className="btn btn-outline" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
