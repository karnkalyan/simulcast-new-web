'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, Plus, Copy, Check, Terminal, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';

interface TokenItem {
  id: string;
  name: string;
  token: string;
  role: string;
  description: string;
  revoked: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export default function AdminMcp() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenExpires, setNewTokenExpires] = useState('30d');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'chatgpt' | 'claude' | 'websocket'>('tokens');

  const masterApiKey = 'simulcast_master_mcp_api_key_2026_sec';

  useEffect(() => {
    loadTokens();
  }, []);

  async function loadTokens() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mcp-tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    setError('');
    setCreatedToken(null);
    try {
      const res = await fetch('/api/admin/mcp-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTokenName.trim(),
          expiresIn: newTokenExpires,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate token');
      setCreatedToken(data.token);
      setNewTokenName('');
      loadTokens();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating token');
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Are you sure you want to revoke this API token? Any client using it will lose access immediately.')) return;
    try {
      await fetch('/api/admin/mcp-tokens', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadTokens();
    } catch (e) {
      console.error(e);
    }
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
          <h1>
            MCP & API Security<span className="admin-pink">.</span>
          </h1>
          <p>
            Manage secure Model Context Protocol endpoints, JWT-encrypted client tokens, and ChatGPT / Claude connections.
          </p>
        </div>
      </div>

      {/* Master API Key Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2b0d3a 0%, #3e1253 60%, #4a1566 100%)',
          color: '#ffffff',
          borderRadius: 8,
          padding: 24,
          boxShadow: '0 8px 24px rgba(43, 13, 58, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={20} color="#e11d72" />
            <strong style={{ fontSize: 15, letterSpacing: '0.04em' }}>Master MCP & AI Engine Key</strong>
          </div>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 999 }}>
            HIGH SECURITY · ROOT ROLE
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
          Authorized for full MCP tools execution, live chat escalation triggers, and Simulcast Intelligence engine inferences.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 6 }}>
          <code style={{ fontSize: 13, flex: 1, fontFamily: 'monospace', color: '#ffb3d9', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {masterApiKey}
          </code>
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
            {copiedKey === 'master' ? 'Copied!' : 'Copy Key'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e7dfeb', paddingBottom: 2 }}>
        {[
          { id: 'tokens', label: 'Active API Tokens & Generator' },
          { id: 'chatgpt', label: 'ChatGPT Integration' },
          { id: 'claude', label: 'Claude Desktop MCP' },
          { id: 'websocket', label: 'WebSocket Protocol' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#2b0d3a' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#6f6277',
              borderBottom: activeTab === tab.id ? '2px solid #e11d72' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tokens' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
          {/* Create Token Box */}
          <form
            onSubmit={handleCreateToken}
            style={{
              background: '#ffffff',
              border: '1px solid #eae4eb',
              borderRadius: 6,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              height: 'fit-content',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: '#2b0d3a' }}>Generate Encrypted JWT Token</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#7b6f84' }}>
              Create encrypted scoped tokens for client applications, ChatGPT plugins, or external integrations.
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Client / Application Name
              <input
                type="text"
                placeholder="e.g. ChatGPT Mobile Client"
                value={newTokenName}
                onChange={e => setNewTokenName(e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Token Expiration
              <select
                value={newTokenExpires}
                onChange={e => setNewTokenExpires(e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
              >
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="365d">1 Year</option>
              </select>
            </label>

            <button type="submit" className="btn btn-pink" style={{ minHeight: 42 }}>
              <Plus size={16} /> Generate API Token
            </button>

            {error && <div className="error-note">{error}</div>}

            {createdToken && (
              <div
                style={{
                  background: '#f4faf6',
                  border: '1px solid #bce6cf',
                  borderRadius: 6,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <strong style={{ fontSize: 12, color: '#1b6b3e' }}>Token Generated Successfully!</strong>
                <code
                  style={{
                    fontSize: 11,
                    wordBreak: 'break-all',
                    background: '#fff',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d4ede0',
                    fontFamily: 'monospace',
                  }}
                >
                  {createdToken}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdToken, 'newly-created')}
                  style={{
                    background: '#1b6b3e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copiedKey === 'newly-created' ? 'Copied!' : 'Copy Token'}
                </button>
              </div>
            )}
          </form>

          {/* Tokens List Table */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eae4eb',
              borderRadius: 6,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #eee5f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#faf8fb',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14, color: '#2b0d3a' }}>Registered MCP & API Tokens</h3>
              <button
                type="button"
                onClick={loadTokens}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#685970' }}
              >
                <RefreshCw size={14} className={loading ? 'sc-chat-spinner' : ''} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fcfafc', borderBottom: '1px solid #eee5f0', color: '#887a91' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>NAME</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>ROLE</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>TOKEN / KEY</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>CREATED</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 28, textAlign: 'center', color: '#9d8ea4' }}>
                        No tokens registered yet. Generate one on the left.
                      </td>
                    </tr>
                  ) : (
                    tokens.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f2edf4', opacity: t.revoked ? 0.5 : 1 }}>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#2b0d3a' }}>{t.name}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: '#f2edf5',
                              padding: '3px 8px',
                              borderRadius: 3,
                              color: '#533c62',
                            }}
                          >
                            {t.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#665770' }}>
                          {t.token.slice(0, 16)}...
                        </td>
                        <td style={{ padding: '14px 18px', color: '#8a7d92' }}>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {!t.revoked ? (
                            <button
                              type="button"
                              onClick={() => handleRevoke(t.id)}
                              style={{
                                background: '#fff0f3',
                                color: '#b91345',
                                border: '1px solid #f7cad6',
                                borderRadius: 4,
                                padding: '4px 10px',
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              Revoke
                            </button>
                          ) : (
                            <span style={{ color: '#a69ba9', fontSize: 11 }}>Revoked</span>
                          )}
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

      {activeTab === 'chatgpt' && (
        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 6, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Connecting ChatGPT Custom GPT to Simulcast MCP Server</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6d6175', lineHeight: 1.6 }}>
            In ChatGPT <strong>Custom GPT → Actions → Create Action</strong>, configure Authentication as <strong>Bearer</strong> and paste the Master MCP Key or a generated JWT token.
          </p>

          <strong style={{ fontSize: 12, color: '#2b0d3a' }}>OpenAPI Schema for ChatGPT Action:</strong>
          <pre
            style={{
              background: '#191220',
              color: '#d6c8e0',
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'monospace',
              overflowX: 'auto',
            }}
          >
{`{
  "openapi": "3.1.0",
  "info": {
    "title": "Simulcast Technologies MCP API",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "${currentHost}/api" }
  ],
  "paths": {
    "/mcp": {
      "post": {
        "operationId": "callMcpTool",
        "summary": "Invoke Simulcast MCP tool or knowledge method",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "jsonrpc": { "type": "string", "example": "2.0" },
                  "method": { "type": "string", "example": "tools/call" },
                  "params": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string", "example": "list_services" },
                      "arguments": { "type": "object" }
                    }
                  },
                  "id": { "type": "integer", "example": 1 }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Success" }
        }
      }
    }
  }
}`}
          </pre>
        </div>
      )}

      {activeTab === 'claude' && (
        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 6, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Claude Desktop Configuration</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6d6175', lineHeight: 1.6 }}>
            Add the following block to your <code>claude_desktop_config.json</code>:
          </p>
          <pre
            style={{
              background: '#191220',
              color: '#d6c8e0',
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'monospace',
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
      )}

      {activeTab === 'websocket' && (
        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 6, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Unified WebSocket MCP Protocol Server (Same Port)</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6d6175', lineHeight: 1.6 }}>
            The WebSocket MCP server is unified directly with the Next.js backend on <strong>the same port (port 3000)</strong> at <code>/api/ws</code>. No secondary port is required!
          </p>

          <strong style={{ fontSize: 12, color: '#2b0d3a' }}>Connection URL:</strong>
          <code style={{ background: '#f6f3f8', padding: '8px 12px', borderRadius: 4, fontFamily: 'monospace', color: '#2b0d3a', border: '1px solid #e5dce8', width: 'fit-content' }}>
            ws://localhost:3000/api/ws?token={masterApiKey}
          </code>

          <strong style={{ fontSize: 12, color: '#2b0d3a', marginTop: 10 }}>Client Connection Example (JavaScript):</strong>
          <pre
            style={{
              background: '#191220',
              color: '#d6c8e0',
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'monospace',
              overflowX: 'auto',
            }}
          >
{`// Connects directly to the same port as the backend (port 3000)
const ws = new WebSocket('ws://localhost:3000/api/ws?token=${masterApiKey}');

ws.onopen = () => {
  console.log('Connected to Simulcast Unified WebSocket on port 3000');
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }));
};

ws.onmessage = (event) => {
  console.log('MCP Response:', JSON.parse(event.data));
};`}
          </pre>
        </div>
      )}
    </div>
  );
}
