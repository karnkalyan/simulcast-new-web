'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Truck,
  Plus,
  Search,
  Mail,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  Phone,
  CheckCircle2,
  Send,
  Eye,
  X,
  Globe,
  Radio,
} from 'lucide-react';
import type { ClientItem, VendorItem } from '@/lib/directory';

export default function AdminClientsVendors() {
  const [activeTab, setActiveTab] = useState<'clients' | 'vendors'>('clients');
  const [loading, setLoading] = useState(false);

  // Clients State
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('ALL');
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: 'Television & Media Network',
    status: 'ACTIVE' as 'ACTIVE' | 'PROSPECT' | 'INACTIVE',
    showOnWebsite: true,
    notes: '',
    logoUrl: '',
  });

  // Vendors State
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState('ALL');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'Hardware Partner',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'INACTIVE',
    showOnWebsite: true,
    notes: '',
    paymentTerms: 'Net 30',
    logoUrl: '',
  });

  // CRM Direct Email Modal State
  const [emailModalRecipient, setEmailModalRecipient] = useState<{ email: string; name: string; company?: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    loadClients();
    loadVendors();
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientStatusFilter !== 'ALL') params.set('status', clientStatusFilter);
      if (clientSearch) params.set('search', clientSearch);
      const res = await fetch(`/api/admin/clients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      } else {
        toast.error('Failed to load clients');
      }
    } catch {
      toast.error('Network error loading clients');
    } finally {
      setLoading(false);
    }
  }

  async function loadVendors() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (vendorCategoryFilter !== 'ALL') params.set('category', vendorCategoryFilter);
      if (vendorSearch) params.set('search', vendorSearch);
      const res = await fetch(`/api/admin/vendors?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      } else {
        toast.error('Failed to load vendors');
      }
    } catch {
      toast.error('Network error loading vendors');
    } finally {
      setLoading(false);
    }
  }

  // Client Handlers
  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      toast.error('Client name and email address are required.');
      return;
    }

    const toastId = toast.loading('Saving client profile...');
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClient?.id,
          ...clientForm,
        }),
      });
      if (res.ok) {
        toast.success(`Client "${clientForm.name}" saved!`, { id: toastId });
        setShowClientModal(false);
        setEditingClient(null);
        loadClients();
      } else {
        toast.error('Failed to save client profile.', { id: toastId });
      }
    } catch {
      toast.error('Network error while saving client.', { id: toastId });
    }
  }

  async function handleDeleteClient(id: string, name: string) {
    if (!confirm(`Delete client record "${name}"?`)) return;
    const toastId = toast.loading(`Deleting ${name}...`);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success(`Client "${name}" removed.`, { id: toastId });
        loadClients();
      } else {
        toast.error('Failed to delete client.', { id: toastId });
      }
    } catch {
      toast.error('Network error deleting client.', { id: toastId });
    }
  }

  function openEditClientModal(c: ClientItem) {
    setEditingClient(c);
    setClientForm({
      name: c.name,
      company: c.company || c.name,
      contactPerson: c.contactPerson || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      website: c.website || '',
      industry: c.industry || 'Television & Media Network',
      status: c.status || 'ACTIVE',
      showOnWebsite: c.showOnWebsite !== false,
      notes: c.notes || '',
      logoUrl: c.logoUrl || '',
    });
    setShowClientModal(true);
  }

  // Vendor Handlers
  async function handleSaveVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorForm.name.trim() || !vendorForm.email.trim()) {
      toast.error('Vendor name and email address are required.');
      return;
    }

    const toastId = toast.loading('Saving vendor details...');
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVendor?.id,
          ...vendorForm,
        }),
      });
      if (res.ok) {
        toast.success(`Vendor "${vendorForm.name}" saved!`, { id: toastId });
        setShowVendorModal(false);
        setEditingVendor(null);
        loadVendors();
      } else {
        toast.error('Failed to save vendor details.', { id: toastId });
      }
    } catch {
      toast.error('Network error saving vendor.', { id: toastId });
    }
  }

  async function handleDeleteVendor(id: string, name: string) {
    if (!confirm(`Delete vendor record "${name}"?`)) return;
    const toastId = toast.loading(`Deleting ${name}...`);
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success(`Vendor "${name}" deleted.`, { id: toastId });
        loadVendors();
      } else {
        toast.error('Failed to delete vendor.', { id: toastId });
      }
    } catch {
      toast.error('Network error deleting vendor.', { id: toastId });
    }
  }

  function openEditVendorModal(v: VendorItem) {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      category: v.category || 'Hardware Partner',
      contactPerson: v.contactPerson || '',
      email: v.email || '',
      phone: v.phone || '',
      address: v.address || '',
      website: v.website || '',
      status: v.status || 'ACTIVE',
      showOnWebsite: v.showOnWebsite !== false,
      notes: v.notes || '',
      paymentTerms: v.paymentTerms || 'Net 30',
      logoUrl: v.logoUrl || '',
    });
    setShowVendorModal(true);
  }

  // CRM Direct Send Email Handler
  async function handleSendDirectEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailModalRecipient || !emailSubject.trim() || !emailBody.trim()) {
      toast.error('Recipient, Subject and Message body are required.');
      return;
    }

    setEmailSending(true);
    const toastId = toast.loading(`Sending email to ${emailModalRecipient.email}...`);
    try {
      const res = await fetch('/api/mcp/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailModalRecipient.email,
          subject: emailSubject.trim(),
          html: emailBody.trim(),
          variables: { name: emailModalRecipient.name },
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.ok)) {
        toast.success(`Email delivered to ${emailModalRecipient.email}!`, { id: toastId });
        setEmailModalRecipient(null);
      } else {
        toast.error(data.error || 'Failed sending email.', { id: toastId });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error sending email', { id: toastId });
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">RELATIONSHIP DIRECTORY / CRM</div>
          <h1>
            Clients &amp; Vendors Directory<span className="admin-pink">.</span>
          </h1>
          <p>
            Manage television stations, broadcast networks, educational institutes, and hardware technology partners. Add new clients &amp; vendors to show live on the website brand crawl and dispatch emails directly.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e8e2ec', borderRadius: 8, padding: '18px 20px', boxShadow: '0 2px 8px rgba(43, 13, 58, 0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7b6f84', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Enterprise Clients
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2b0d3a', marginTop: 4 }}>
            {clients.length}
          </div>
          <div style={{ fontSize: 12, color: '#7b6f84', marginTop: 2 }}>
            {clients.filter((c) => c.showOnWebsite !== false).length} displaying on website brand ticker
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e2ec', borderRadius: 8, padding: '18px 20px', boxShadow: '0 2px 8px rgba(43, 13, 58, 0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#e11d72', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Suppliers &amp; Technology Partners
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e11d72', marginTop: 4 }}>
            {vendors.length}
          </div>
          <div style={{ fontSize: 12, color: '#7b6f84', marginTop: 2 }}>
            {vendors.filter((v) => v.showOnWebsite !== false).length} active hardware/monitoring partners
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #eee5f0' }}>
        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`btn ${activeTab === 'clients' ? 'btn-pink' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: '6px 6px 0 0' }}
        >
          <Building2 size={16} /> Enterprise Clients ({clients.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`btn ${activeTab === 'vendors' ? 'btn-pink' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: '6px 6px 0 0' }}
        >
          <Truck size={16} /> Technology Partners ({vendors.length})
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: CLIENTS */}
      {/* ========================================== */}
      {activeTab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flex: '1 1 320px', maxWidth: 500 }}>
              <div className="admin-search" style={{ flex: 1, margin: 0 }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search client, TV network, or contact..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadClients()}
                />
              </div>

              <select
                className="admin-input"
                value={clientStatusFilter}
                onChange={(e) => {
                  setClientStatusFilter(e.target.value);
                  setTimeout(loadClients, 50);
                }}
                style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={loadClients} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingClient(null);
                  setClientForm({
                    name: '',
                    company: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    website: '',
                    industry: 'Television & Media Network',
                    status: 'ACTIVE',
                    showOnWebsite: true,
                    notes: '',
                    logoUrl: '',
                  });
                  setShowClientModal(true);
                }}
                className="btn btn-pink"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Add Client
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client / Network</th>
                  <th>Contact Person</th>
                  <th>Email &amp; Phone</th>
                  <th>Category</th>
                  <th>Website Ticker</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#2b0d3a' }}>{c.name}</div>
                      {c.company && c.company !== c.name && (
                        <div style={{ fontSize: 11, color: '#7b6f84' }}>{c.company}</div>
                      )}
                    </td>
                    <td>{c.contactPerson || '—'}</td>
                    <td>
                      <div>
                        <a href={`mailto:${c.email}`} style={{ color: '#e11d72', textDecoration: 'none', fontWeight: 600 }}>
                          {c.email}
                        </a>
                      </div>
                      {c.phone && <div style={{ fontSize: 11, color: '#7b6f84' }}>{c.phone}</div>}
                    </td>
                    <td>
                      <span className="admin-pill" style={{ background: '#fdf4f8', color: '#9d174d' }}>
                        {c.industry}
                      </span>
                    </td>
                    <td>
                      {c.showOnWebsite !== false ? (
                        <span className="admin-pill" style={{ background: '#ecfdf5', color: '#065f46', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Shown in Ticker
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>Hidden</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="admin-pill"
                        style={{
                          background: c.status === 'ACTIVE' ? '#ecfdf5' : '#fef3c7',
                          color: c.status === 'ACTIVE' ? '#065f46' : '#92400e',
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-row-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailModalRecipient({ email: c.email, name: c.contactPerson || c.name, company: c.company || c.name });
                            setEmailSubject(`Simulcast Technologies — Update for ${c.name}`);
                            setEmailBody(`<p>Dear ${c.contactPerson || c.name},</p><p>Greetings from Simulcast Technologies.</p>`);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Send direct email"
                        >
                          <Mail size={13} color="#e11d72" /> Send Email
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditClientModal(c)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClient(c.id, c.name)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px', color: '#b91c1c', borderColor: '#fecaca' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clients.length === 0 && !loading && (
              <div className="admin-empty">No client records found. Click &quot;Add Client&quot; to create one.</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: VENDORS */}
      {/* ========================================== */}
      {activeTab === 'vendors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flex: '1 1 320px', maxWidth: 500 }}>
              <div className="admin-search" style={{ flex: 1, margin: 0 }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search partner, manufacturer, or category..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadVendors()}
                />
              </div>

              <select
                className="admin-input"
                value={vendorCategoryFilter}
                onChange={(e) => {
                  setVendorCategoryFilter(e.target.value);
                  setTimeout(loadVendors, 50);
                }}
                style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              >
                <option value="ALL">All Categories</option>
                <option value="Hardware Partner">Hardware Partner</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Conversion & Routing">Conversion & Routing</option>
                <option value="Streaming Systems">Streaming Systems</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={loadVendors} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingVendor(null);
                  setVendorForm({
                    name: '',
                    category: 'Hardware Partner',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    website: '',
                    status: 'ACTIVE',
                    showOnWebsite: true,
                    notes: '',
                    paymentTerms: 'Net 30',
                    logoUrl: '',
                  });
                  setShowVendorModal(true);
                }}
                className="btn btn-pink"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Add Partner / Vendor
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendor / Partner</th>
                  <th>Category</th>
                  <th>Contact Person</th>
                  <th>Email &amp; Phone</th>
                  <th>Website Ticker</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#2b0d3a' }}>{v.name}</div>
                      {v.website && (
                        <a
                          href={v.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 11, color: '#e11d72', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                        >
                          Visit site <ExternalLink size={10} />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="admin-pill" style={{ background: '#f5f3ff', color: '#5b21b6' }}>
                        {v.category}
                      </span>
                    </td>
                    <td>{v.contactPerson || '—'}</td>
                    <td>
                      <div>
                        <a href={`mailto:${v.email}`} style={{ color: '#e11d72', textDecoration: 'none', fontWeight: 600 }}>
                          {v.email}
                        </a>
                      </div>
                      {v.phone && <div style={{ fontSize: 11, color: '#7b6f84' }}>{v.phone}</div>}
                    </td>
                    <td>
                      {v.showOnWebsite !== false ? (
                        <span className="admin-pill" style={{ background: '#ecfdf5', color: '#065f46', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Shown in Ticker
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>Hidden</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="admin-pill"
                        style={{
                          background: v.status === 'ACTIVE' ? '#ecfdf5' : '#fef3c7',
                          color: v.status === 'ACTIVE' ? '#065f46' : '#92400e',
                        }}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-row-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailModalRecipient({ email: v.email, name: v.contactPerson || v.name, company: v.name });
                            setEmailSubject(`Simulcast Technologies — Partnership Inquiry for ${v.name}`);
                            setEmailBody(`<p>Dear ${v.contactPerson || v.name},</p><p>We are reaching out regarding equipment supply and partnership.</p>`);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Send direct email"
                        >
                          <Mail size={13} color="#e11d72" /> Send Email
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditVendorModal(v)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(v.id, v.name)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px', color: '#b91c1c', borderColor: '#fecaca' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vendors.length === 0 && !loading && (
              <div className="admin-empty">No vendor records found. Click &quot;Add Partner&quot; to create one.</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CLIENT CREATE / EDIT MODAL */}
      {/* ========================================== */}
      {showClientModal && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true">
          <div className="cms-modal-scrim" onClick={() => setShowClientModal(false)} />
          <div className="cms-modal" style={{ maxWidth: 680 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">{editingClient ? 'EDIT RECORD' : 'NEW CLIENT'}</div>
                <h2>{editingClient ? editingClient.name : 'Add Enterprise Client'}</h2>
              </div>
              <button aria-label="Close" onClick={() => setShowClientModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div className="cms-fields">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="cms-field">
                    <label>Client / Brand Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      required
                      placeholder="e.g. TV Today, AP1 HD"
                      value={clientForm.name}
                      onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Company / Network Legal Name</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. TV Today HD Network"
                      value={clientForm.company}
                      onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="cms-field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="admin-input"
                      required
                      placeholder="broadcast@network.com.np"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Key contact or station director"
                      value={clientForm.contactPerson}
                      onChange={(e) => setClientForm({ ...clientForm, contactPerson: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="cms-field">
                    <label>Category / Industry</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Television & Media Network"
                      value={clientForm.industry}
                      onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="+977 1 4XXXXXX"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="cms-field">
                    <label>Location / Address</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Kathmandu, Nepal"
                      value={clientForm.address}
                      onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Status</label>
                    <select
                      className="admin-input"
                      value={clientForm.status}
                      onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as any })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PROSPECT">PROSPECT</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Website Ticker Toggle */}
                <div style={{ background: '#faf8fb', padding: '12px 16px', borderRadius: 6, border: '1px solid #e8e2ec' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#2b0d3a', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={clientForm.showOnWebsite}
                      onChange={(e) => setClientForm({ ...clientForm, showOnWebsite: e.target.checked })}
                    />
                    Display on Website Brand Ticker &amp; Client Crawl
                  </label>
                  <p style={{ margin: '4px 0 0 24px', fontSize: 12, color: '#7b6f84' }}>
                    When checked, this client name appears in the scrolling technology partner and client showcase on the homepage.
                  </p>
                </div>

                <div className="cms-field">
                  <label>Technical Notes &amp; Scope</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    placeholder="Details about playout automation, transmission equipment, transmitter power..."
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="cms-modal-foot">
                <button type="button" onClick={() => setShowClientModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-pink">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VENDOR CREATE / EDIT MODAL */}
      {/* ========================================== */}
      {showVendorModal && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true">
          <div className="cms-modal-scrim" onClick={() => setShowVendorModal(false)} />
          <div className="cms-modal" style={{ maxWidth: 680 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">{editingVendor ? 'EDIT RECORD' : 'NEW PARTNER'}</div>
                <h2>{editingVendor ? editingVendor.name : 'Add Technology Partner / Vendor'}</h2>
              </div>
              <button aria-label="Close" onClick={() => setShowVendorModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor}>
              <div className="cms-fields">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="cms-field">
                    <label>Partner / Vendor Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      required
                      placeholder="e.g. Blackmagic Design, Feelworld"
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Category *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Hardware Partner, Monitoring"
                      value={vendorForm.category}
                      onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="cms-field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="admin-input"
                      required
                      placeholder="sales@vendor.com"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Website URL</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="https://www.vendor.com"
                      value={vendorForm.website}
                      onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="cms-field">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="APAC distribution lead"
                      value={vendorForm.contactPerson}
                      onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Status</label>
                    <select
                      className="admin-input"
                      value={vendorForm.status}
                      onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value as any })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Website Ticker Toggle */}
                <div style={{ background: '#faf8fb', padding: '12px 16px', borderRadius: 6, border: '1px solid #e8e2ec' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#2b0d3a', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={vendorForm.showOnWebsite}
                      onChange={(e) => setVendorForm({ ...vendorForm, showOnWebsite: e.target.checked })}
                    />
                    Display on Website Brand Ticker &amp; Partner Crawl
                  </label>
                  <p style={{ margin: '4px 0 0 24px', fontSize: 12, color: '#7b6f84' }}>
                    When checked, this brand name loops in the main homepage technology partner showcase.
                  </p>
                </div>

                <div className="cms-field">
                  <label>Equipment Catalog &amp; Notes</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    placeholder="Details about hardware items, switches, convertors, warranty agreements..."
                    value={vendorForm.notes}
                    onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="cms-modal-foot">
                <button type="button" onClick={() => setShowVendorModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-pink">
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CRM DIRECT SEND EMAIL MODAL */}
      {/* ========================================== */}
      {emailModalRecipient && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true">
          <div className="cms-modal-scrim" onClick={() => setEmailModalRecipient(null)} />
          <div className="cms-modal" style={{ maxWidth: 660 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">CRM DIRECT EMAIL DISPATCH</div>
                <h2>Send to {emailModalRecipient.company || emailModalRecipient.name}</h2>
              </div>
              <button aria-label="Close" onClick={() => setEmailModalRecipient(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendDirectEmail}>
              <div className="cms-fields">
                <div className="cms-field">
                  <label>Recipient Email</label>
                  <input
                    type="text"
                    className="admin-input"
                    readOnly
                    value={`${emailModalRecipient.name} <${emailModalRecipient.email}>`}
                    style={{ background: '#f5f3f7', color: '#5b4a69' }}
                  />
                </div>

                <div className="cms-field">
                  <label>Subject *</label>
                  <input
                    type="text"
                    className="admin-input"
                    required
                    placeholder="Enter subject line..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="cms-field">
                  <label>Message Body (Formatted HTML / Text) *</label>
                  <textarea
                    className="admin-input"
                    rows={8}
                    required
                    placeholder="Write your email message..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
              </div>

              <div className="cms-modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#7b6f84' }}>
                  Sent from <strong>support@simulcast.com.np</strong>
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setEmailModalRecipient(null)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-pink" disabled={emailSending}>
                    <Send size={15} /> {emailSending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
