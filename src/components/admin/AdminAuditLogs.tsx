"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Activity,
  Layers,
  KeyRound,
  Mail,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import type { AuditLogEntry } from "@/lib/audit";

const categoryIcons: Record<string, React.ComponentType<{ size: number }>> = {
  MCP: KeyRound,
  EMAIL: Mail,
  INSIGHTS: FileText,
  MEDIA: ImageIcon,
  AUTH: ShieldCheck,
  SETTINGS: Layers,
  SYSTEM: Activity,
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [categoryFilter]);

  async function loadAuditLogs() {
    setLoading(true);
    try {
      const url = `/api/admin/audit-logs?category=${categoryFilter}&search=${encodeURIComponent(search)}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Heading */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">SECURITY & OBSERVABILITY / AUDIT LOGS</div>
          <h1>
            System Audit Trail<span className="admin-pink">.</span>
          </h1>
          <p>
            Detailed traceability records of Model Context Protocol calls, email queues, content changes, image uploads, and security operations.
          </p>
        </div>
      </div>

      {/* Toolbar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 450 }}>
          <Search size={16} color="#6d6975" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadAuditLogs()}
            placeholder="Search by action, actor, or target..."
            style={{
              width: "100%",
              padding: "7px 12px",
              borderRadius: 6,
              border: "1px solid #d5ccd8",
              fontSize: 13,
            }}
          />
          <button onClick={loadAuditLogs} className="btn btn-outline" style={{ padding: "6px 12px" }}>
            Search
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Filter size={16} color="#6d6975" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #d5ccd8",
              fontSize: 13,
              fontWeight: 600,
              color: "#2b0d3a",
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="MCP">MCP Actions</option>
            <option value="EMAIL">Email Operations</option>
            <option value="INSIGHTS">Insights & Articles</option>
            <option value="MEDIA">Media & Uploads</option>
            <option value="AUTH">Authentication</option>
            <option value="SETTINGS">Site Settings</option>
          </select>

          <button onClick={loadAuditLogs} className="btn btn-outline" style={{ padding: "6px 12px" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-shell">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Category</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const Icon = categoryIcons[log.category] || Activity;
                const isSuccess = log.status === "SUCCESS";

                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: "#6d6975", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 4,
                          background: "#f4f0f6",
                          color: "#2b0d3a",
                        }}
                      >
                        <Icon size={12} />
                        {log.category}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: 13, color: "#2b0d3a" }}>{log.action}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "#4f4957" }}>{log.actor}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "#6d6975" }}>{log.target || "—"}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: isSuccess ? "#d1fae5" : "#fee2e2",
                          color: isSuccess ? "#065f46" : "#b91c1c",
                        }}
                      >
                        {isSuccess ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => setSelectedLog(log)} title="View Details">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && logs.length === 0 && (
            <div className="admin-empty">No audit events found. Actions across the system will be logged here.</div>
          )}
          {loading && <div className="admin-empty">Loading audit logs...</div>}
        </div>
      </div>

      {/* Modal: View Details */}
      {selectedLog && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true" aria-label="Audit log details">
          <div className="cms-modal-scrim" onClick={() => setSelectedLog(null)} />
          <div className="cms-modal" style={{ maxWidth: 600 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">AUDIT RECORD #{selectedLog.id.slice(-8)}</div>
                <h2>{selectedLog.action}</h2>
              </div>
              <button aria-label="Close" onClick={() => setSelectedLog(null)}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", width: 120, fontWeight: 700 }}>Timestamp:</td>
                    <td style={{ padding: "6px 0" }}>{new Date(selectedLog.createdAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Category:</td>
                    <td style={{ padding: "6px 0" }}>{selectedLog.category}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Actor:</td>
                    <td style={{ padding: "6px 0", fontWeight: 700, color: "#2b0d3a" }}>{selectedLog.actor}</td>
                  </tr>
                  {selectedLog.target && (
                    <tr>
                      <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Target:</td>
                      <td style={{ padding: "6px 0" }}>{selectedLog.target}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>Status:</td>
                    <td style={{ padding: "6px 0" }}>{selectedLog.status}</td>
                  </tr>
                  {selectedLog.ipAddress && (
                    <tr>
                      <td style={{ padding: "6px 0", color: "#6d6975", fontWeight: 700 }}>IP Address:</td>
                      <td style={{ padding: "6px 0", fontFamily: "monospace" }}>{selectedLog.ipAddress}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {selectedLog.details && (
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: "#2b0d3a", marginBottom: 6 }}>
                    Event Details:
                  </strong>
                  <pre
                    style={{
                      background: "#f7f5fa",
                      padding: 12,
                      borderRadius: 6,
                      border: "1px solid #e8e2ec",
                      fontSize: 12,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedLog.details}
                  </pre>
                </div>
              )}
            </div>

            <div className="cms-modal-actions" style={{ marginTop: 24 }}>
              <button type="button" className="btn btn-outline" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
