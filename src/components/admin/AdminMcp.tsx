'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  Plus,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
  Activity,
  Wrench,
  Search,
  Globe,
  Mail,
  Database,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
} from 'lucide-react';

interface ConnectionItem {
  id: string;
  clientName: string;
  clientId: string;
  token: string;
  tokenPrefix: string;
  role: string;
  scopes: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  ipAddress?: string | null;
  userAgent?: string | null;
  requestCount: number;
  lastTool?: string | null;
  expiresAt?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConnectionLogItem {
  id: string;
  connectionId?: string | null;
  clientName: string;
  event: 'AUTHORIZE' | 'CONNECT' | 'TOOL_CALL' | 'DISCONNECT' | 'RECONNECT' | 'BLOCKED';
  toolName?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'REVOKED';
  ipAddress?: string | null;
  details?: string | null;
  createdAt: string;
}

interface CustomToolItem {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: any;
  handlerType: 'WEBHOOK' | 'DYNAMIC_TEMPLATE' | 'EMAIL_ALERT' | 'DATABASE_QUERY';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlerConfig: any;
  runCount: number;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminMcp() {
  const [activeTab, setActiveTab] = useState<'connections' | 'logs' | 'custom_tools' | 'tools' | 'chatgpt' | 'claude'>('connections');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Connections State
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [connStats, setConnStats] = useState({ total: 0, connected: 0, disconnected: 0, totalCalls: 0 });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientRole, setNewClientRole] = useState('MCP_ADMIN');
  const [newClientExpires, setNewClientExpires] = useState('90d');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [connError, setConnError] = useState('');

  // Logs State
  const [logs, setLogs] = useState<ConnectionLogItem[]>([]);
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<ConnectionLogItem | null>(null);

  // Custom Tools State
  const [customTools, setCustomTools] = useState<CustomToolItem[]>([]);
  const [showToolModal, setShowToolModal] = useState(false);
  const [toolError, setToolError] = useState('');
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [toolForm, setToolForm] = useState({
    name: '',
    title: '',
    description: '',
    category: 'Information',
    handlerType: 'DYNAMIC_TEMPLATE' as 'WEBHOOK' | 'DYNAMIC_TEMPLATE' | 'EMAIL_ALERT' | 'DATABASE_QUERY',
    templateText: '# {{title}}\nResult: {{message}}',
    webhookUrl: '',
    webhookMethod: 'POST',
    webhookHeaders: '{"Content-Type": "application/json"}',
    emailRecipient: 'support@simulcast.com.np',
    emailSubjectPrefix: '[MCP Custom Tool]',
    dbTarget: 'services',
    parametersJson: JSON.stringify(
      {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Query parameter or subject' },
        },
      },
      null,
      2
    ),
  });

  const masterApiKey = 'simulcast_master_mcp_api_key_2026_sec';

  useEffect(() => {
    loadConnections();
    loadLogs();
    loadCustomTools();
  }, []);

  async function loadConnections() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mcp-connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        if (data.stats) setConnStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try {
      const params = new URLSearchParams();
      if (logFilter !== 'ALL') params.set('event', logFilter);
      if (logSearch) params.set('search', logSearch);
      const res = await fetch(`/api/admin/mcp-connection-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadCustomTools() {
    try {
      const res = await fetch('/api/admin/mcp-custom-tools');
      if (res.ok) {
        const data = await res.json();
        setCustomTools(data.tools || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: 'CONNECTED' | 'DISCONNECTED') {
    const nextStatus = currentStatus === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    const confirmMsg =
      nextStatus === 'DISCONNECTED'
        ? 'Disconnect this MCP client? Any requests or tool calls from ChatGPT or this client will be rejected immediately.'
        : 'Reconnect this MCP client? It will immediately regain access to execute MCP tools.';
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/mcp-connections/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        loadConnections();
        loadLogs();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteConnection(id: string) {
    if (!confirm('Permanently remove this authorized connection?')) return;
    try {
      const res = await fetch('/api/admin/mcp-connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        loadConnections();
        loadLogs();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setConnError('');
    setCreatedToken(null);
    try {
      const res = await fetch('/api/admin/mcp-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newClientName.trim(),
          role: newClientRole,
          expiresIn: newClientExpires,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to authorize connection');
      setCreatedToken(data.token);
      setNewClientName('');
      loadConnections();
      loadLogs();
    } catch (err: unknown) {
      setConnError(err instanceof Error ? err.message : 'Error authorizing client');
    }
  }

  async function handleToggleTool(id: string, currentEnabled: boolean) {
    try {
      await fetch('/api/admin/mcp-custom-tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentEnabled }),
      });
      loadCustomTools();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteTool(id: string) {
    if (!confirm('Are you sure you want to delete this custom MCP tool?')) return;
    try {
      await fetch('/api/admin/mcp-custom-tools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadCustomTools();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveCustomTool(e: React.FormEvent) {
    e.preventDefault();
    if (!toolForm.name.trim() || !toolForm.description.trim()) {
      setToolError('Tool name and description are required.');
      return;
    }

    setToolError('');
    let parsedParams = {};
    try {
      parsedParams = JSON.parse(toolForm.parametersJson);
    } catch {
      setToolError('Parameters must be valid JSON schema format.');
      return;
    }

    let handlerConfig: Record<string, unknown> = {};
    if (toolForm.handlerType === 'DYNAMIC_TEMPLATE') {
      handlerConfig = { template: toolForm.templateText };
    } else if (toolForm.handlerType === 'WEBHOOK') {
      let headers = {};
      try {
        headers = JSON.parse(toolForm.webhookHeaders || '{}');
      } catch {}
      handlerConfig = {
        url: toolForm.webhookUrl,
        method: toolForm.webhookMethod,
        headers,
      };
    } else if (toolForm.handlerType === 'EMAIL_ALERT') {
      handlerConfig = {
        recipient: toolForm.emailRecipient,
        subjectPrefix: toolForm.emailSubjectPrefix,
      };
    } else if (toolForm.handlerType === 'DATABASE_QUERY') {
      handlerConfig = { target: toolForm.dbTarget };
    }

    try {
      const res = await fetch('/api/admin/mcp-custom-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingToolId || undefined,
          name: toolForm.name.trim(),
          title: toolForm.title.trim() || toolForm.name.trim(),
          description: toolForm.description.trim(),
          category: toolForm.category,
          enabled: true,
          parameters: parsedParams,
          handlerType: toolForm.handlerType,
          handlerConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save custom tool');
      setShowToolModal(false);
      setEditingToolId(null);
      loadCustomTools();
    } catch (err: unknown) {
      setToolError(err instanceof Error ? err.message : 'Error saving custom tool');
    }
  }

  function openEditToolModal(tool: CustomToolItem) {
    setEditingToolId(tool.id);
    let tmpl = '# {{title}}\nResult: {{message}}';
    let wUrl = '';
    let wMethod = 'POST';
    let wHeaders = '{"Content-Type": "application/json"}';
    let eRecipient = 'support@simulcast.com.np';
    let ePrefix = '[MCP Custom Tool]';
    let dTarget = 'services';

    if (tool.handlerType === 'DYNAMIC_TEMPLATE') {
      tmpl = tool.handlerConfig?.template || '';
    } else if (tool.handlerType === 'WEBHOOK') {
      wUrl = tool.handlerConfig?.url || '';
      wMethod = tool.handlerConfig?.method || 'POST';
      wHeaders = JSON.stringify(tool.handlerConfig?.headers || {}, null, 2);
    } else if (tool.handlerType === 'EMAIL_ALERT') {
      eRecipient = tool.handlerConfig?.recipient || 'support@simulcast.com.np';
      ePrefix = tool.handlerConfig?.subjectPrefix || '[MCP Custom Tool]';
    } else if (tool.handlerType === 'DATABASE_QUERY') {
      dTarget = tool.handlerConfig?.target || 'services';
    }

    setToolForm({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      category: tool.category,
      handlerType: tool.handlerType,
      templateText: tmpl,
      webhookUrl: wUrl,
      webhookMethod: wMethod,
      webhookHeaders: wHeaders,
      emailRecipient: eRecipient,
      emailSubjectPrefix: ePrefix,
      dbTarget: dTarget,
      parametersJson: JSON.stringify(tool.parameters || {}, null, 2),
    });
    setToolError('');
    setShowToolModal(true);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://www.simulcast.com.np';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">INTEGRATION / MODEL CONTEXT PROTOCOL</div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            MCP Connected Clients & Tools<span className="admin-pink">.</span>
          </h1>
          <p>
            Monitor authorized MCP connections (ChatGPT, Claude, Cursor), connect and disconnect clients with one click, inspect live authorized activity logs, and configure Custom MCP Tools dynamically.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7b6f84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Authorized Clients
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2b0d3a', marginTop: 4 }}>
            {connStats.total}
          </div>
          <div style={{ fontSize: 12, color: '#9d8f9e', marginTop: 2 }}>Configured integrations</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Active Connected
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {connStats.connected}
          </div>
          <div style={{ fontSize: 12, color: '#9d8f9e', marginTop: 2 }}>Authorized & executing</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Disconnected / Revoked
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            {connStats.disconnected}
          </div>
          <div style={{ fontSize: 12, color: '#9d8f9e', marginTop: 2 }}>Blocked from MCP tools</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7b6f84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Tool Executions
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2b0d3a', marginTop: 4 }}>
            {connStats.totalCalls}
          </div>
          <div style={{ fontSize: 12, color: '#9d8f9e', marginTop: 2 }}>Calls processed across clients</div>
        </div>
      </div>

      {/* Master API Key Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2b0d3a 0%, #3e1253 60%, #4a1566 100%)',
          color: '#ffffff',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 6px 20px rgba(43, 13, 58, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(225, 29, 114, 0.2)', padding: 8, borderRadius: 6, color: '#e11d72' }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>Master MCP Admin Security Key</div>
              <div style={{ fontSize: 12, color: '#d8c2e3' }}>Super-admin authorization key for server-to-server tunnels & direct MCP clients.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(masterApiKey, 'master')}
            style={{
              background: '#e11d72',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            {copiedKey === 'master' ? <Check size={14} /> : <Copy size={14} />}
            {copiedKey === 'master' ? 'Copied Key!' : 'Copy Master Key'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e7dfeb', paddingBottom: 2, flexWrap: 'wrap' }}>
        {[
          { id: 'connections', label: 'Connected Clients & Disconnect', icon: Power },
          { id: 'logs', label: 'Authorized Connection Logs', icon: Activity },
          { id: 'custom_tools', label: 'Custom MCP Tools Builder', icon: Wrench },
          { id: 'tools', label: 'MCP Built-in Tools Catalog', icon: Sliders },
          { id: 'chatgpt', label: 'ChatGPT Integration', icon: Globe },
          { id: 'claude', label: 'Claude Desktop MCP', icon: Terminal },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                if (tab.id === 'logs') loadLogs();
                if (tab.id === 'custom_tools') loadCustomTools();
              }}
              style={{
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: isActive ? '#2b0d3a' : 'transparent',
                color: isActive ? '#ffffff' : '#6f6277',
                borderBottom: isActive ? '2px solid #e11d72' : 'none',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONNECTED CLIENTS & DISCONNECT */}
      {activeTab === 'connections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Connected Authorized MCP Clients</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7b6f84' }}>
                View all authorized clients. Click <strong>Disconnect</strong> to instantly revoke tool execution rights for ChatGPT or any client.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={loadConnections}
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: 12 }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setConnError('');
                  setCreatedToken(null);
                  setShowConnectModal(true);
                }}
                className="btn btn-pink"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                <Plus size={14} /> Connect / Authorize Client
              </button>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client / Application</th>
                    <th>Status</th>
                    <th>Token Prefix / ID</th>
                    <th>Role / Scopes</th>
                    <th>Calls Processed</th>
                    <th>Last Active / Last Tool</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#9d8f9e' }}>
                        No connected clients yet. Click &quot;Connect / Authorize Client&quot; to register one.
                      </td>
                    </tr>
                  ) : (
                    connections.map((c) => {
                      const isConnected = c.status === 'CONNECTED';
                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#2b0d3a', fontSize: 13 }}>{c.clientName}</div>
                            <div style={{ fontSize: 11, color: '#9d8f9e' }}>
                              IP: {c.ipAddress || '127.0.0.1'} | {c.userAgent || 'MCP Client'}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: isConnected ? '#f0fdf4' : '#fef2f2',
                                color: isConnected ? '#16a34a' : '#dc2626',
                                border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: isConnected ? '#16a34a' : '#dc2626',
                                }}
                              />
                              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                            </span>
                          </td>
                          <td>
                            <code style={{ fontSize: 11, background: '#f8f6f9', padding: '3px 6px', borderRadius: 4, color: '#6a1885' }}>
                              {c.tokenPrefix}
                            </code>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#2b0d3a' }}>{c.role}</div>
                            <div style={{ fontSize: 11, color: '#9d8f9e' }}>{c.scopes}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#2b0d3a' }}>
                              {c.requestCount || 0}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, color: '#2b0d3a' }}>
                              {c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleString() : 'Never'}
                            </div>
                            {c.lastTool && (
                              <div style={{ fontSize: 11, color: '#e11d72', fontWeight: 600 }}>
                                {c.lastTool}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(c.id, c.status)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: isConnected ? '#fee2e2' : '#dcfce7',
                                  color: isConnected ? '#991b1b' : '#166534',
                                }}
                                title={isConnected ? 'Disconnect this client' : 'Reconnect this client'}
                              >
                                {isConnected ? <PowerOff size={12} /> : <Power size={12} />}
                                {isConnected ? 'Disconnect' : 'Reconnect'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteConnection(c.id)}
                                style={{
                                  padding: '5px 8px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                }}
                                title="Delete connection"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTHORIZED CONNECTION LOGS */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Connected Authorized Logs</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7b6f84' }}>
                Inspect connection handshakes, OAuth authorizations, MCP tool executions, and disconnect events.
              </p>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: 12 }}
            >
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#9d8f9e' }} />
              <input
                type="text"
                placeholder="Search by client, tool name, or details..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  border: '1px solid #dcd4e1',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['ALL', 'AUTHORIZE', 'CONNECT', 'TOOL_CALL', 'DISCONNECT', 'RECONNECT', 'BLOCKED'].map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => {
                    setLogFilter(ev);
                    setTimeout(loadLogs, 50);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: '1px solid #e7dfeb',
                    background: logFilter === ev ? '#2b0d3a' : '#ffffff',
                    color: logFilter === ev ? '#ffffff' : '#6f6277',
                    cursor: 'pointer',
                  }}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Client</th>
                    <th>Event</th>
                    <th>Tool / Target</th>
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#9d8f9e' }}>
                        No connection logs found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    logs.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => setSelectedLog(l)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view log details"
                      >
                        <td style={{ fontSize: 11, color: '#7b6f84', whiteSpace: 'nowrap' }}>
                          {new Date(l.createdAt).toLocaleTimeString()} · {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: 700, color: '#2b0d3a', fontSize: 12 }}>
                          {l.clientName}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              background:
                                l.event === 'AUTHORIZE'
                                  ? '#eff6ff'
                                  : l.event === 'TOOL_CALL'
                                  ? '#fdf2f8'
                                  : l.event === 'DISCONNECT' || l.event === 'BLOCKED'
                                  ? '#fef2f2'
                                  : '#f0fdf4',
                              color:
                                l.event === 'AUTHORIZE'
                                  ? '#2563eb'
                                  : l.event === 'TOOL_CALL'
                                  ? '#db2777'
                                  : l.event === 'DISCONNECT' || l.event === 'BLOCKED'
                                  ? '#dc2626'
                                  : '#16a34a',
                            }}
                          >
                            {l.event}
                          </span>
                        </td>
                        <td>
                          {l.toolName ? (
                            <code style={{ fontSize: 11, color: '#e11d72', background: '#fdf2f8', padding: '2px 6px', borderRadius: 4 }}>
                              {l.toolName}
                            </code>
                          ) : (
                            <span style={{ color: '#9d8f9e', fontSize: 11 }}>—</span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: l.status === 'SUCCESS' ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: '#7b6f84' }}>{l.ipAddress || '127.0.0.1'}</td>
                        <td style={{ fontSize: 12, color: '#4a3e52', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM MCP TOOLS BUILDER */}
      {activeTab === 'custom_tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Custom MCP Tools Builder</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7b6f84' }}>
                Build and expose custom MCP tools to ChatGPT and Claude. Tools automatically register in <code>tools/list</code> and execute dynamically.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={loadCustomTools}
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: 12 }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingToolId(null);
                  setToolError('');
                  setToolForm({
                    name: '',
                    title: '',
                    description: '',
                    category: 'Information',
                    handlerType: 'DYNAMIC_TEMPLATE',
                    templateText: '# {{title}}\nResult: {{message}}',
                    webhookUrl: '',
                    webhookMethod: 'POST',
                    webhookHeaders: '{"Content-Type": "application/json"}',
                    emailRecipient: 'support@simulcast.com.np',
                    emailSubjectPrefix: '[MCP Custom Tool]',
                    dbTarget: 'services',
                    parametersJson: JSON.stringify(
                      {
                        type: 'object',
                        properties: {
                          query: { type: 'string', description: 'Query parameter or subject' },
                        },
                      },
                      null,
                      2
                    ),
                  });
                  setShowToolModal(true);
                }}
                className="btn btn-pink"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                <Plus size={14} /> Create Custom Tool
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {customTools.map((t) => (
              <div
                key={t.id}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${t.enabled ? '#eae4eb' : '#f1ebf2'}`,
                  borderRadius: 8,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  opacity: t.enabled ? 1 : 0.65,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#fdf2f8',
                          color: '#db2777',
                        }}
                      >
                        {t.category}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#eff6ff',
                          color: '#2563eb',
                        }}
                      >
                        {t.handlerType}
                      </span>
                    </div>
                    <h4 style={{ margin: '8px 0 2px', fontSize: 15, color: '#2b0d3a' }}>{t.title}</h4>
                    <code style={{ fontSize: 12, color: '#e11d72', fontWeight: 600 }}>{t.name}</code>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} title="Toggle tool enabled">
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      onChange={() => handleToggleTool(t.id, t.enabled)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#e11d72' }}
                    />
                  </label>
                </div>

                <p style={{ margin: 0, fontSize: 12, color: '#6f6277', lineHeight: 1.5 }}>
                  {t.description}
                </p>

                <div style={{ fontSize: 11, color: '#9d8f9e', borderTop: '1px solid #f6f3f7', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Runs: <strong>{t.runCount || 0}</strong> {t.lastRunAt && `· Last: ${new Date(t.lastRunAt).toLocaleTimeString()}`}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openEditToolModal(t)}
                      style={{ border: 'none', background: 'transparent', color: '#2b0d3a', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTool(t.id)}
                      style={{ border: 'none', background: 'transparent', color: '#dc2626', fontSize: 11, cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BUILT-IN TOOLS CATALOG */}
      {activeTab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>MCP Tools Catalog</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7b6f84' }}>
              Built-in tools available to authenticated AI agents, including Email Sending, Bulk Queue, and Image Uploads.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {[
              {
                name: 'upload_media_image',
                category: 'Media & Uploads',
                desc: 'Upload an image into Simulcast public uploads from external URL or Base64 payload.',
                params: 'url (string) OR data (base64 string), filename, alt',
              },
              {
                name: 'create_blog_post',
                category: 'Blog & Insights',
                desc: 'Publish or draft blog posts/insights with direct imageUrl or imageBase64 cover upload.',
                params: 'title, excerpt, body, imageUrl, imageBase64, imageFilename, published',
              },
              {
                name: 'send_email',
                category: 'Email Dispatch',
                desc: 'Send transactional or queued email from Simulcast with attachments support.',
                params: 'to, subject, html, attachments [{ filename, path/content }], queue (bool)',
              },
              {
                name: 'send_bulk_emails',
                category: 'Email Queue System',
                desc: 'Queue 100+ bulk personalized emails with templating {{name}} and delivery logging.',
                params: 'recipients [{ to, name }], subject, html, batchId, attachments',
              },
              {
                name: 'get_email_queue_status',
                category: 'Queue Management',
                desc: 'Inspect real-time pending, processing, sent, and failed queue counts.',
                params: 'status (optional filter), limit',
              },
              {
                name: 'process_email_queue',
                category: 'Queue Worker',
                desc: 'Process the next batch of queued emails and record delivery logs.',
                params: 'limit (number)',
              },
              {
                name: 'get_audit_logs',
                category: 'Audit Trail',
                desc: 'Retrieve system and MCP audit trail records.',
                params: 'category, search, limit',
              },
            ].map((t) => (
              <div key={t.name} style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 18 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#fdf2f8', color: '#db2777' }}>
                  {t.category}
                </span>
                <h4 style={{ margin: '8px 0 4px', fontSize: 14, color: '#2b0d3a' }}>{t.name}</h4>
                <p style={{ margin: 0, fontSize: 12, color: '#6f6277', lineHeight: 1.5 }}>{t.desc}</p>
                <div style={{ marginTop: 10, fontSize: 11, color: '#9d8f9e' }}>
                  <strong>Parameters:</strong> <code>{t.params}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHATGPT INTEGRATION */}
      {activeTab === 'chatgpt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 24 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>ChatGPT OpenAI Action Setup</h3>
            <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#7b6f84' }}>
              Connect your custom GPT to Simulcast using the OAuth 2.0 endpoints or API Key header.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fcfafc', border: '1px solid #e7dfeb', padding: 14, borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7b6f84' }}>MCP / ACTIONS SCHEMA URL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <code style={{ fontSize: 12, color: '#2b0d3a' }}>{currentHost}/api/mcp</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${currentHost}/api/mcp`, 'schemaUrl')}
                    style={{ border: 'none', background: 'transparent', color: '#e11d72', cursor: 'pointer' }}
                  >
                    {copiedKey === 'schemaUrl' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ background: '#fcfafc', border: '1px solid #e7dfeb', padding: 14, borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7b6f84' }}>OAUTH TOKEN URL (FOR CHATGPT ACTIONS)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <code style={{ fontSize: 12, color: '#2b0d3a' }}>{currentHost}/api/oauth/token</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${currentHost}/api/oauth/token`, 'tokenUrl')}
                    style={{ border: 'none', background: 'transparent', color: '#e11d72', cursor: 'pointer' }}
                  >
                    {copiedKey === 'tokenUrl' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CLAUDE DESKTOP */}
      {activeTab === 'claude' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 24 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Claude Desktop Configuration</h3>
            <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#7b6f84' }}>
              Add Simulcast to your <code>claude_desktop_config.json</code> using the SSE or WebSocket connection.
            </p>

            <pre
              style={{
                background: '#1d1222',
                color: '#f3e8f7',
                padding: 16,
                borderRadius: 6,
                fontSize: 12,
                overflowX: 'auto',
              }}
            >
{`{
  "mcpServers": {
    "simulcast": {
      "url": "${currentHost}/api/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${masterApiKey}"
      }
    }
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL 1: CONNECT / AUTHORIZE CLIENT */}
      {showConnectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 7, 31, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              width: '100%',
              maxWidth: 520,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Authorize New MCP Client</h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#7b6f84' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: '#7b6f84' }}>
              Register and connect ChatGPT, Claude, Cursor, or an internal agent. This generates an encrypted JWT token and logs the connection.
            </p>

            <form onSubmit={handleCreateConnection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Client Name / Application
                <input
                  type="text"
                  placeholder="e.g. ChatGPT Mobile Client or Marketing Agent"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Role & Permissions
                  <select
                    value={newClientRole}
                    onChange={(e) => setNewClientRole(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="MCP_ADMIN">MCP_ADMIN (All Tools)</option>
                    <option value="MCP_CLIENT">MCP_CLIENT (Standard Tools)</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Token Expiration
                  <select
                    value={newClientExpires}
                    onChange={(e) => setNewClientExpires(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                    <option value="365d">1 Year</option>
                  </select>
                </label>
              </div>

              {connError && <div style={{ fontSize: 12, color: '#dc2626' }}>{connError}</div>}

              {createdToken ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Client Authorized Successfully!</div>
                  <code style={{ fontSize: 11, wordBreak: 'break-all', background: '#fff', padding: 8, borderRadius: 4 }}>{createdToken}</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdToken, 'modalToken')}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 11, alignSelf: 'flex-start' }}
                  >
                    {copiedKey === 'modalToken' ? <Check size={12} /> : <Copy size={12} />} Copy Access Token
                  </button>
                </div>
              ) : (
                <button type="submit" className="btn btn-pink" style={{ minHeight: 40, marginTop: 4 }}>
                  <Plus size={14} /> Authorize & Connect
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CUSTOM MCP TOOL BUILDER */}
      {showToolModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 7, 31, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              width: '100%',
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>
                {editingToolId ? 'Edit Custom MCP Tool' : 'Create Custom MCP Tool'}
              </h3>
              <button
                type="button"
                onClick={() => setShowToolModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#7b6f84' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomTool} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Tool Function Name (snake_case)
                  <input
                    type="text"
                    placeholder="e.g. get_support_escalation"
                    value={toolForm.name}
                    onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                    required
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Category
                  <select
                    value={toolForm.category}
                    onChange={(e) => setToolForm({ ...toolForm, category: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="Information">Information</option>
                    <option value="Notification">Notification</option>
                    <option value="Webhook">Webhook / HTTP</option>
                    <option value="Database">Database Query</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Display Title
                <input
                  type="text"
                  placeholder="e.g. Escalate Urgent Support Ticket"
                  value={toolForm.title}
                  onChange={(e) => setToolForm({ ...toolForm, title: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Tool Description (Instruction for AI Agent)
                <textarea
                  rows={3}
                  placeholder="Explain clearly to the LLM when and why it should invoke this tool."
                  value={toolForm.description}
                  onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
                  required
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13, resize: 'vertical' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Handler Execution Type
                <select
                  value={toolForm.handlerType}
                  onChange={(e) => setToolForm({ ...toolForm, handlerType: e.target.value as typeof toolForm.handlerType })}
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                >
                  <option value="DYNAMIC_TEMPLATE">Dynamic Template (Markdown / Text response with variable interpolation)</option>
                  <option value="WEBHOOK">Webhook (Forward request to external REST API URL)</option>
                  <option value="EMAIL_ALERT">Email Notification (Send alert email to admin on call)</option>
                  <option value="DATABASE_QUERY">Database Query (Safe query on Services or Projects)</option>
                </select>
              </label>

              {/* Handler Specific Fields */}
              {toolForm.handlerType === 'DYNAMIC_TEMPLATE' && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Response Template (Use &#123;&#123;variable&#125;&#125; placeholders)
                  <textarea
                    rows={4}
                    value={toolForm.templateText}
                    onChange={(e) => setToolForm({ ...toolForm, templateText: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}
                  />
                </label>
              )}

              {toolForm.handlerType === 'WEBHOOK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                      Method
                      <select
                        value={toolForm.webhookMethod}
                        onChange={(e) => setToolForm({ ...toolForm, webhookMethod: e.target.value })}
                        style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                      </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                      Webhook Endpoint URL
                      <input
                        type="url"
                        placeholder="https://api.example.com/webhook"
                        value={toolForm.webhookUrl}
                        onChange={(e) => setToolForm({ ...toolForm, webhookUrl: e.target.value })}
                        required
                        style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {toolForm.handlerType === 'EMAIL_ALERT' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                    Alert Recipient Email
                    <input
                      type="email"
                      value={toolForm.emailRecipient}
                      onChange={(e) => setToolForm({ ...toolForm, emailRecipient: e.target.value })}
                      required
                      style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                    Subject Prefix
                    <input
                      type="text"
                      value={toolForm.emailSubjectPrefix}
                      onChange={(e) => setToolForm({ ...toolForm, emailSubjectPrefix: e.target.value })}
                      style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                    />
                  </label>
                </div>
              )}

              {toolForm.handlerType === 'DATABASE_QUERY' && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Target Collection
                  <select
                    value={toolForm.dbTarget}
                    onChange={(e) => setToolForm({ ...toolForm, dbTarget: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="services">Published Services</option>
                    <option value="projects">Published Projects / Case Studies</option>
                  </select>
                </label>
              )}

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Parameters JSON Schema
                <textarea
                  rows={4}
                  value={toolForm.parametersJson}
                  onChange={(e) => setToolForm({ ...toolForm, parametersJson: e.target.value })}
                  required
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}
                />
              </label>

              {toolError && <div style={{ fontSize: 12, color: '#dc2626' }}>{toolError}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowToolModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-pink" style={{ padding: '8px 20px', fontSize: 12 }}>
                  {editingToolId ? 'Update Tool' : 'Save & Publish Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONNECTION LOG DETAIL */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 7, 31, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              width: '100%',
              maxWidth: 500,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#2b0d3a' }}>Log Event Details</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#7b6f84' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div><strong>Client:</strong> {selectedLog.clientName}</div>
              <div><strong>Event:</strong> {selectedLog.event}</div>
              {selectedLog.toolName && <div><strong>Tool:</strong> <code>{selectedLog.toolName}</code></div>}
              <div><strong>Status:</strong> {selectedLog.status}</div>
              <div><strong>IP:</strong> {selectedLog.ipAddress || '127.0.0.1'}</div>
              <div><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
              <div>
                <strong>Details:</strong>
                <p style={{ margin: '4px 0 0', padding: 10, background: '#f8f6f9', borderRadius: 4 }}>
                  {selectedLog.details || 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
