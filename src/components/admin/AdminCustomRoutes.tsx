'use client';

import React, { useState, useEffect } from 'react';
import {
  Route as RouteIcon,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Code2,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  Globe2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CustomRoute {
  id: string;
  path: string;
  name: string;
  description: string;
  method: string;
  contentType: string;
  statusCode: number;
  responseBody: string;
  headers?: string | null;
  enabled: boolean;
  hitCount: number;
  lastHitAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const PRESET_TEMPLATES = [
  {
    label: 'Nexus Device Endpoints (PHP)',
    path: '/api/nexus.php',
    name: 'Nexus Device Endpoints',
    description: 'Production and private endpoints for Nexus TV Today (returns dynamic init & device URLs)',
    method: 'ALL',
    contentType: 'application/json',
    statusCode: 200,
    headers: JSON.stringify({ 'Access-Control-Allow-Origin': '*' }, null, 2),
    body: JSON.stringify(
      {
        init_url: 'https://nexus.tvtoday.com.np/api/init_device.php',
        device_url: 'https://nexus.tvtoday.com.np/device.php',
        pvt_init_url: 'http://192.168.5.208/nexus/api/init_device.php',
        pvt_device_url: 'http://192.168.5.208/nexus/device.php',
      },
      null,
      2
    ),
  },
  {
    label: 'App URL Endpoint (/api/app_url.php)',
    path: '/api/app_url.php',
    name: 'Nexus App URL Endpoint',
    description: 'Legacy PHP compatibility endpoint for external set-top boxes & mobile apps',
    method: 'ALL',
    contentType: 'application/json',
    statusCode: 200,
    headers: JSON.stringify({ 'Access-Control-Allow-Origin': '*' }, null, 2),
    body: JSON.stringify(
      {
        init_url: 'https://nexus.tvtoday.com.np/api/init_device.php',
        device_url: 'https://nexus.tvtoday.com.np/device.php',
        pvt_init_url: 'http://192.168.5.208/nexus/api/init_device.php',
        pvt_device_url: 'http://192.168.5.208/nexus/device.php',
      },
      null,
      2
    ),
  },
  {
    label: 'Streaming / M3U8 Config',
    path: '/api/streams.json',
    name: 'TV Stream Manifests',
    description: 'Dynamic live HLS / DASH stream configuration',
    method: 'GET',
    contentType: 'application/json',
    statusCode: 200,
    headers: JSON.stringify({ 'Access-Control-Allow-Origin': '*' }, null, 2),
    body: JSON.stringify(
      {
        channels: [
          { id: 'tvtoday-hd', name: 'TV Today HD', stream_url: 'https://stream.simulcast.com.np/live/tvtoday.m3u8' }
        ],
        updated_at: new Date().toISOString()
      },
      null,
      2
    ),
  },
  {
    label: 'Health & Status API',
    path: '/api/status.php',
    name: 'System Status Ping',
    description: 'High-availability monitor status output',
    method: 'ALL',
    contentType: 'application/json',
    statusCode: 200,
    headers: JSON.stringify({ 'Access-Control-Allow-Origin': '*' }, null, 2),
    body: JSON.stringify({ status: 'ok', uptime_pct: 99.99, service: 'Simulcast Dynamic API Gateway' }, null, 2),
  },
];

export default function AdminCustomRoutes() {
  const [routes, setRoutes] = useState<CustomRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedBodyId, setExpandedBodyId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<CustomRoute | null>(null);
  const [formPath, setFormPath] = useState('/api/nexus.php');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMethod, setFormMethod] = useState('ALL');
  const [formContentType, setFormContentType] = useState('application/json');
  const [formStatusCode, setFormStatusCode] = useState(200);
  const [formResponseBody, setFormResponseBody] = useState('{\n  \n}');
  const [formHeaders, setFormHeaders] = useState('{\n  "Access-Control-Allow-Origin": "*"\n}');
  const [formEnabled, setFormEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [jsonValidationMsg, setJsonValidationMsg] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/custom-routes');
      if (res.ok) {
        const data = await res.json();
        setRoutes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load custom routes', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal(preset?: typeof PRESET_TEMPLATES[0]) {
    setEditingRoute(null);
    setFormError('');
    if (preset) {
      setFormPath(preset.path);
      setFormName(preset.name);
      setFormDescription(preset.description);
      setFormMethod(preset.method);
      setFormContentType(preset.contentType);
      setFormStatusCode(preset.statusCode);
      setFormResponseBody(preset.body);
      setFormHeaders(preset.headers);
      setFormEnabled(true);
    } else {
      setFormPath('/api/nexus.php');
      setFormName('');
      setFormDescription('');
      setFormMethod('ALL');
      setFormContentType('application/json');
      setFormStatusCode(200);
      setFormResponseBody('{\n  "status": "online"\n}');
      setFormHeaders('{\n  "Access-Control-Allow-Origin": "*"\n}');
      setFormEnabled(true);
    }
    validateJsonSyntax(preset ? preset.body : '{\n  "status": "online"\n}', preset ? preset.contentType : 'application/json');
    setIsModalOpen(true);
  }

  function openEditModal(route: CustomRoute) {
    setEditingRoute(route);
    setFormError('');
    setFormPath(route.path);
    setFormName(route.name);
    setFormDescription(route.description || '');
    setFormMethod(route.method || 'ALL');
    setFormContentType(route.contentType || 'application/json');
    setFormStatusCode(route.statusCode || 200);
    setFormResponseBody(route.responseBody || '');
    setFormHeaders(route.headers || '{\n  "Access-Control-Allow-Origin": "*"\n}');
    setFormEnabled(route.enabled);
    validateJsonSyntax(route.responseBody || '', route.contentType || 'application/json');
    setIsModalOpen(true);
  }

  function validateJsonSyntax(content: string, type: string) {
    if (!type.includes('json')) {
      setJsonValidationMsg(null);
      return;
    }
    try {
      JSON.parse(content);
      setJsonValidationMsg({ valid: true, message: 'Valid JSON format' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      setJsonValidationMsg({ valid: false, message: msg });
    }
  }

  function formatJsonBody() {
    try {
      const parsed = JSON.parse(formResponseBody);
      setFormResponseBody(JSON.stringify(parsed, null, 2));
      setJsonValidationMsg({ valid: true, message: 'JSON successfully formatted' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot format invalid JSON';
      setJsonValidationMsg({ valid: false, message: msg });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    let normalizedPath = formPath.trim();
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    const payload = {
      path: normalizedPath,
      name: formName.trim() || normalizedPath,
      description: formDescription.trim(),
      method: formMethod,
      contentType: formContentType.trim() || 'application/json',
      statusCode: Number(formStatusCode) || 200,
      responseBody: formResponseBody,
      headers: formHeaders.trim() ? formHeaders.trim() : null,
      enabled: formEnabled,
    };

    try {
      const url = editingRoute
        ? `/api/admin/custom-routes/${editingRoute.id}`
        : '/api/admin/custom-routes';
      const method = editingRoute ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save route');
      }

      setIsModalOpen(false);
      await loadRoutes();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      const res = await fetch(`/api/admin/custom-routes/${id}/toggle`, {
        method: 'POST',
      });
      if (res.ok) {
        setRoutes(prev =>
          prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string, path: string) {
    if (!confirm(`Are you sure you want to delete route "${path}"? External devices or clients calling this path will receive 404.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/custom-routes/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRoutes(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  function copyUrl(path: string, id: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.simulcast.com.np';
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.simulcast.com.np';

  const filteredRoutes = routes.filter(r => {
    const matchSearch =
      r.path.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
      (r.responseBody && r.responseBody.toLowerCase().includes(search.toLowerCase()));

    const matchMethod =
      filterMethod === 'ALL' ? true : r.method.toUpperCase() === filterMethod.toUpperCase();

    return matchSearch && matchMethod;
  });

  const totalHits = routes.reduce((acc, r) => acc + (r.hitCount || 0), 0);
  const activeCount = routes.filter(r => r.enabled).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Heading */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">API ROUTING / DYNAMIC ENDPOINTS</div>
          <h1>
            Custom Routes & JSON Output<span className="admin-pink">.</span>
          </h1>
          <p>
            Define custom URL endpoints (including <code>.php</code> compatible routes, JSON APIs, and device endpoints) with custom headers, status codes, and instant live serving.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => openCreateModal(PRESET_TEMPLATES[0])}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={16} /> Load Nexus Example
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreateModal()}
            style={{
              background: '#e11d72',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 15px rgba(225, 29, 114, 0.4)',
            }}
          >
            <Plus size={16} /> Add Custom Route
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-stat">
          <span>Total Configured Routes</span>
          <RouteIcon size={20} />
          <strong>{routes.length.toString().padStart(2, '0')}</strong>
          <small>Dynamic endpoints active in system</small>
        </div>

        <div className="admin-stat">
          <span>Active Endpoints</span>
          <Zap size={20} style={{ color: '#10b981' }} />
          <strong style={{ color: '#10b981' }}>{activeCount.toString().padStart(2, '0')}</strong>
          <small>Serving responses to callers</small>
        </div>

        <div className="admin-stat">
          <span>Total Requests Served</span>
          <Globe2 size={20} style={{ color: '#3b82f6' }} />
          <strong style={{ color: '#3b82f6' }}>{totalHits.toLocaleString()}</strong>
          <small>All-time device & client hits</small>
        </div>

        <div className="admin-stat">
          <span>PHP Compatibility</span>
          <Code2 size={20} style={{ color: '#a855f7' }} />
          <strong style={{ fontSize: 18, color: '#a855f7' }}>Native .php</strong>
          <small>Seamless URL rewrite & direct serve</small>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 18px',
          borderRadius: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Search size={18} style={{ color: '#998ea3' }} />
          <input
            type="text"
            placeholder="Search by path (e.g. /api/nexus.php), name, or response content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: 13,
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#998ea3', fontWeight: 600 }}>METHOD:</span>
          {['ALL', 'GET', 'POST'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterMethod(m)}
              style={{
                background: filterMethod === m ? '#e11d72' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={loadRoutes}
            title="Refresh routes"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#c8b6d3',
              padding: '6px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Routes List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#998ea3' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading custom routes...</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
          }}
        >
          <RouteIcon size={36} style={{ color: '#e11d72', margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ color: '#ffffff', marginBottom: 8 }}>No custom routes found</h3>
          <p style={{ color: '#998ea3', fontSize: 13, maxWidth: 460, margin: '0 auto 20px' }}>
            {search
              ? 'No routes matched your search criteria.'
              : 'Add your first custom route, such as /api/nexus.php or /api/app_url.php, to output JSON to your external devices and applications.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreateModal(PRESET_TEMPLATES[0])}
            style={{
              background: '#e11d72',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={16} /> Load Nexus Device Preset (/api/nexus.php)
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredRoutes.map(route => {
            const isExpanded = expandedBodyId === route.id;
            const fullUrl = `${originUrl}${route.path}`;

            return (
              <div
                key={route.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: route.enabled
                    ? '1px solid rgba(255, 255, 255, 0.09)'
                    : '1px solid rgba(255, 255, 255, 0.03)',
                  opacity: route.enabled ? 1 : 0.65,
                  borderRadius: 8,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Route Header Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Method Badge */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 4,
                        letterSpacing: '0.05em',
                        background:
                          route.method === 'GET'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : route.method === 'POST'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(168, 85, 247, 0.2)',
                        color:
                          route.method === 'GET'
                            ? '#34d399'
                            : route.method === 'POST'
                            ? '#60a5fa'
                            : '#c084fc',
                        border: `1px solid ${
                          route.method === 'GET'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : route.method === 'POST'
                            ? 'rgba(59, 130, 246, 0.3)'
                            : 'rgba(168, 85, 247, 0.4)'
                        }`,
                      }}
                    >
                      {route.method}
                    </span>

                    {/* Path */}
                    <span
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#ffffff',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {route.path}
                    </span>

                    {/* Copy full URL button */}
                    <button
                      type="button"
                      onClick={() => copyUrl(route.path, route.id)}
                      title="Copy full URL"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedId === route.id ? '#10b981' : '#a795b5',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        padding: '3px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {copiedId === route.id ? (
                        <>
                          <Check size={14} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy URL
                        </>
                      )}
                    </button>

                    {/* Open in new tab link */}
                    <a
                      href={route.path}
                      target="_blank"
                      rel="noreferrer"
                      title="Open endpoint in browser"
                      style={{
                        color: '#c8b6d3',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        textDecoration: 'none',
                        padding: '3px 6px',
                      }}
                    >
                      <ExternalLink size={14} /> Test in Tab
                    </a>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Hit counter */}
                    <span
                      style={{
                        fontSize: 11,
                        color: '#c8b6d3',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      ⚡ {route.hitCount || 0} hits
                    </span>

                    {/* Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(route.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: route.enabled ? '#10b981' : '#6b7280',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      title={route.enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {route.enabled ? (
                        <>
                          <ToggleRight size={22} /> Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={22} /> Disabled
                        </>
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(route)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.07)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(route.id, route.path)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        padding: '6px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                      title="Delete route"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Route Info & Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: 13, marginRight: 8 }}>{route.name}</strong>
                    {route.description && (
                      <span style={{ color: '#998ea3', fontSize: 12 }}>— {route.description}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#998ea3' }}>
                    <span>Type: <strong style={{ color: '#c8b6d3' }}>{route.contentType}</strong></span>
                    <span>Status: <strong style={{ color: '#10b981' }}>{route.statusCode || 200}</strong></span>
                    {route.lastHitAt && (
                      <span>Last hit: <strong style={{ color: '#c8b6d3' }}>{new Date(route.lastHitAt).toLocaleTimeString()}</strong></span>
                    )}
                  </div>
                </div>

                {/* Preview / Accordion of Response Body */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedBodyId(isExpanded ? null : route.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#e11d72',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Code2 size={14} /> {isExpanded ? 'Hide Output JSON' : 'Show Output JSON'}
                    </button>
                    <span style={{ fontSize: 11, color: '#776b82' }}>
                      URL: {fullUrl}
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 10 }}>
                      <pre
                        style={{
                          background: '#0d0413',
                          border: '1px solid rgba(225, 29, 114, 0.2)',
                          padding: 12,
                          borderRadius: 6,
                          color: '#f3e8ff',
                          fontSize: 12,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          overflowX: 'auto',
                          maxHeight: 260,
                        }}
                      >
                        {route.responseBody}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => !saving && setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#180a22',
              border: '1px solid rgba(225, 29, 114, 0.3)',
              borderRadius: 12,
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              padding: 24,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: 14,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, color: '#ffffff', margin: 0 }}>
                  {editingRoute ? 'Edit Custom Route' : 'Create Custom Route'}
                </h2>
                <p style={{ color: '#998ea3', fontSize: 12, margin: '4px 0 0' }}>
                  Define endpoint path, output JSON body, headers, and HTTP behavior.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#998ea3',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {/* Quick Templates Selector (when creating new) */}
            {!editingRoute && (
              <div
                style={{
                  background: 'rgba(225, 29, 114, 0.08)',
                  border: '1px dashed rgba(225, 29, 114, 0.3)',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} style={{ color: '#e11d72' }} />
                  <span style={{ fontSize: 12, color: '#f3e8ff', fontWeight: 600 }}>Quick Presets:</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRESET_TEMPLATES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormPath(p.path);
                        setFormName(p.name);
                        setFormDescription(p.description);
                        setFormMethod(p.method);
                        setFormContentType(p.contentType);
                        setFormStatusCode(p.statusCode);
                        setFormResponseBody(p.body);
                        setFormHeaders(p.headers);
                        validateJsonSyntax(p.body, p.contentType);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Route Path & Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8b6d3', marginBottom: 6 }}>
                    Route Path (URL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPath}
                    onChange={e => setFormPath(e.target.value)}
                    placeholder="/api/nexus.php"
                    style={{
                      width: '100%',
                      background: '#0d0413',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: 'ui-monospace, monospace',
                      outline: 'none',
                    }}
                  />
                  <small style={{ color: '#776b82', fontSize: 11, display: 'block', marginTop: 4 }}>
                    Example: <code>/api/nexus.php</code>, <code>/api/app_url.php</code>
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8b6d3', marginBottom: 6 }}>
                    Route Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Nexus Device Endpoints"
                    style={{
                      width: '100%',
                      background: '#0d0413',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8b6d3', marginBottom: 6 }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Config endpoints returning public and private URLs for devices"
                  style={{
                    width: '100%',
                    background: '#0d0413',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Method, Content-Type, Status Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8b6d3', marginBottom: 6 }}>
                    HTTP Method
                  </label>
                  <select
                    value={formMethod}
                    onChange={e => setFormMethod(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0d0413',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="ALL">ALL (GET, POST, etc.)</option>
                    <option value="GET">GET only</option>
                    <option value="POST">POST only</option>
                    <option value="PUT">PUT only</option>
                    <option value="DELETE">DELETE only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8b6d3', marginBottom: 6 }}>
                    Content-Type Header
                  </label>
                  <select
                    value={formContentType}
                    onChange={e => {
                      setFormContentType(e.target.value);
                      validateJsonSyntax(formResponseBody, e.target.value);
                    }}
                    style={{
                      width: '100%',
                      background: '#0d0413',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="application/json">application/json</option>
                    <option value="text/plain">text/plain</option>
                    <option value="application/xml">application/xml</option>
                    <option value="text/html">text/html</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8b6d3', marginBottom: 6 }}>
                    Status Code
                  </label>
                  <input
                    type="number"
                    value={formStatusCode}
                    onChange={e => setFormStatusCode(parseInt(e.target.value, 10) || 200)}
                    style={{
                      width: '100%',
                      background: '#0d0413',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Response Body Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#c8b6d3' }}>
                    Response Output Body (JSON / Content) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {jsonValidationMsg && (
                      <span
                        style={{
                          fontSize: 11,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: jsonValidationMsg.valid ? '#10b981' : '#f87171',
                        }}
                      >
                        {jsonValidationMsg.valid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        {jsonValidationMsg.message}
                      </span>
                    )}
                    {formContentType.includes('json') && (
                      <button
                        type="button"
                        onClick={formatJsonBody}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Format JSON
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  required
                  rows={9}
                  value={formResponseBody}
                  onChange={e => {
                    setFormResponseBody(e.target.value);
                    validateJsonSyntax(e.target.value, formContentType);
                  }}
                  style={{
                    width: '100%',
                    background: '#0d0413',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f3e8ff',
                    padding: '12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Custom Headers */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8b6d3', marginBottom: 6 }}>
                  Custom HTTP Headers (JSON Key-Value)
                </label>
                <textarea
                  rows={3}
                  value={formHeaders}
                  onChange={e => setFormHeaders(e.target.value)}
                  placeholder='{"Access-Control-Allow-Origin": "*"}'
                  style={{
                    width: '100%',
                    background: '#0d0413',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f3e8ff',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'ui-monospace, monospace',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Enabled Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="formEnabled"
                  checked={formEnabled}
                  onChange={e => setFormEnabled(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e11d72' }}
                />
                <label htmlFor="formEnabled" style={{ color: '#ffffff', fontSize: 13, cursor: 'pointer' }}>
                  Enable this route immediately (active and serving traffic)
                </label>
              </div>

              {/* Form Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 10,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#c8b6d3',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#e11d72',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(225, 29, 114, 0.4)',
                  }}
                >
                  {saving ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
