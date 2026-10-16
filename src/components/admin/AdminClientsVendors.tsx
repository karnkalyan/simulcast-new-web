'use client';

import React, { useState, useEffect } from 'react';
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
  Clock,
  Send,
  AlertCircle,
  Upload,
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
    industry: 'Broadcasting & DTH',
    status: 'ACTIVE' as 'ACTIVE' | 'PROSPECT' | 'INACTIVE',
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
    category: 'Hardware & RF Transmitters',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'INACTIVE',
    notes: '',
    paymentTerms: 'Net 30',
    logoUrl: '',
  });

  // Email Modal State
  const [emailModalRecipient, setEmailModalRecipient] = useState<{ email: string; name: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ ok: boolean; msg: string } | null>(null);

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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Client Handlers
  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email) return;

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
        setShowClientModal(false);
        setEditingClient(null);
        loadClients();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteClient(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete client record "${name}"?`)) return;
    try {
      await fetch('/api/admin/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadClients();
    } catch (e) {
      console.error(e);
    }
  }

  function openEditClientModal(c: ClientItem) {
    setEditingClient(c);
    setClientForm({
      name: c.name,
      company: c.company,
      contactPerson: c.contactPerson,
      email: c.email,
      phone: c.phone,
      address: c.address,
      website: c.website,
      industry: c.industry,
      status: c.status,
      notes: c.notes,
      logoUrl: c.logoUrl,
    });
    setShowClientModal(true);
  }

  // Vendor Handlers
  async function handleSaveVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.email) return;

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
        setShowVendorModal(false);
        setEditingVendor(null);
        loadVendors();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteVendor(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      await fetch('/api/admin/vendors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadVendors();
    } catch (e) {
      console.error(e);
    }
  }

  function openEditVendorModal(v: VendorItem) {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      category: v.category,
      contactPerson: v.contactPerson,
      email: v.email,
      phone: v.phone,
      address: v.address,
      website: v.website,
      status: v.status,
      notes: v.notes,
      paymentTerms: v.paymentTerms,
      logoUrl: v.logoUrl,
    });
    setShowVendorModal(true);
  }

  // Direct Send Email
  async function handleSendDirectEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailModalRecipient || !emailSubject.trim() || !emailBody.trim()) return;

    setEmailSending(true);
    setEmailStatusMsg(null);
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
      if (res.ok) {
        setEmailStatusMsg({ ok: true, msg: `Email delivered to ${emailModalRecipient.email} from support@simulcast.com.np!` });
        setTimeout(() => {
          setEmailModalRecipient(null);
          setEmailStatusMsg(null);
        }, 2000);
      } else {
        setEmailStatusMsg({ ok: false, msg: data.error || 'Failed sending email' });
      }
    } catch (e: unknown) {
      setEmailStatusMsg({ ok: false, msg: e instanceof Error ? e.message : 'Error sending email' });
    } finally {
      setEmailSending(false);
    }
  }

  // Quick File Upload for Logo
  async function handleLogoUpload(file: File, type: 'client' | 'vendor') {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.path || data.url;
        if (type === 'client') {
          setClientForm((prev) => ({ ...prev, logoUrl: url }));
        } else {
          setVendorForm((prev) => ({ ...prev, logoUrl: url }));
        }
      }
    } catch (err) {
      console.error('Logo upload error:', err);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">RELATIONSHIP MANAGEMENT / DIRECTORY</div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Clients & Vendors Directory<span className="admin-pink">.</span>
          </h1>
          <p>
            Manage enterprise broadcast clients, ISP operators, hardware manufacturers, and cloud technology partners. Send direct emails from <code>support@simulcast.com.np</code> with one click.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7b6f84', textTransform: 'uppercase' }}>
            Total Enterprise Clients
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2b0d3a', marginTop: 4 }}>
            {clients.length}
          </div>
          <div style={{ fontSize: 12, color: '#9d8f9e', marginTop: 2 }}>
            {clients.filter((c) => c.status === 'ACTIVE').length} Active Contracts · {clients.filter((c) => c.status === 'PROSPECT').length} Prospects
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#e11d72', textTransform: 'uppercase' }}>
            Suppliers & Vendors
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#e11d72', marginTop: 4 }}>
            {vendors.length}
          </div>
          <div style={{ fontSize: 12, color: '#9d8f9e', marginTop: 2 }}>
            {vendors.filter((v) => v.status === 'ACTIVE').length} Active Tier-1 Suppliers
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e7dfeb', paddingBottom: 2 }}>
        <button
          type="button"
          onClick={() => setActiveTab('clients')}
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
            background: activeTab === 'clients' ? '#2b0d3a' : 'transparent',
            color: activeTab === 'clients' ? '#ffffff' : '#6f6277',
            borderBottom: activeTab === 'clients' ? '2px solid #e11d72' : 'none',
          }}
        >
          <Building2 size={15} /> Enterprise Clients ({clients.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
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
            background: activeTab === 'vendors' ? '#2b0d3a' : 'transparent',
            color: activeTab === 'vendors' ? '#ffffff' : '#6f6277',
            borderBottom: activeTab === 'vendors' ? '2px solid #e11d72' : 'none',
          }}
        >
          <Truck size={15} /> Vendors & Suppliers ({vendors.length})
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: CLIENTS */}
      {/* ==================================================== */}
      {activeTab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Action & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flex: '1 1 300px', maxWidth: 500 }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#9d8f9e' }} />
                <input
                  type="text"
                  placeholder="Search by company, name, contact, or email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadClients()}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #dcd4e1', borderRadius: 6, fontSize: 12 }}
                />
              </div>

              <select
                value={clientStatusFilter}
                onChange={(e) => {
                  setClientStatusFilter(e.target.value);
                  setTimeout(loadClients, 50);
                }}
                style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 6, fontSize: 12 }}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={loadClients} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: 12 }}>
                <RefreshCw size={14} /> Refresh
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
                    industry: 'Broadcasting & DTH',
                    status: 'ACTIVE',
                    notes: '',
                    logoUrl: '',
                  });
                  setShowClientModal(true);
                }}
                className="btn btn-pink"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                <Plus size={14} /> Add New Client
              </button>
            </div>
          </div>

          {/* Clients Table */}
          <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Company / Client</th>
                    <th>Contact Person</th>
                    <th>Email & Phone</th>
                    <th>Industry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 36, color: '#9d8f9e' }}>
                        No clients found. Click &quot;Add New Client&quot; to register your first client account.
                      </td>
                    </tr>
                  ) : (
                    clients.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#2b0d3a', fontSize: 13 }}>{c.company}</div>
                          <div style={{ fontSize: 11, color: '#7b6f84' }}>{c.name}</div>
                          {c.website && (
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 11, color: '#e11d72', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}
                            >
                              {c.website.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                            </a>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#2b0d3a' }}>{c.contactPerson || '—'}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: '#2b0d3a' }}>{c.email}</div>
                          {c.phone && <div style={{ fontSize: 11, color: '#7b6f84' }}>{c.phone}</div>}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#fdf2f8', color: '#db2777' }}>
                            {c.industry}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: c.status === 'ACTIVE' ? '#f0fdf4' : c.status === 'PROSPECT' ? '#eff6ff' : '#fef2f2',
                              color: c.status === 'ACTIVE' ? '#16a34a' : c.status === 'PROSPECT' ? '#2563eb' : '#dc2626',
                            }}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEmailModalRecipient({ email: c.email, name: c.contactPerson || c.company });
                                setEmailSubject(`Regarding Simulcast Technologies Partnership — ${c.company}`);
                                setEmailBody(`Hello ${c.contactPerson || c.company},\n\nWe are following up regarding our ongoing engineering collaboration.\n\nBest regards,\nSimulcast Team`);
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 4,
                                border: '1px solid #e11d72',
                                background: '#fdf2f8',
                                color: '#e11d72',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              title="Send Email from support@simulcast.com.np"
                            >
                              <Mail size={12} /> Email
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditClientModal(c)}
                              style={{ border: 'none', background: 'transparent', color: '#2b0d3a', cursor: 'pointer', padding: 4 }}
                              title="Edit Client"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClient(c.id, c.company)}
                              style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: 4 }}
                              title="Delete Client"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* ==================================================== */}
      {/* TAB 2: VENDORS */}
      {/* ==================================================== */}
      {activeTab === 'vendors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Action & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flex: '1 1 300px', maxWidth: 500 }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#9d8f9e' }} />
                <input
                  type="text"
                  placeholder="Search vendors by name, category, or contact..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadVendors()}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #dcd4e1', borderRadius: 6, fontSize: 12 }}
                />
              </div>

              <select
                value={vendorCategoryFilter}
                onChange={(e) => {
                  setVendorCategoryFilter(e.target.value);
                  setTimeout(loadVendors, 50);
                }}
                style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 6, fontSize: 12 }}
              >
                <option value="ALL">All Categories</option>
                <option value="Hardware & RF Transmitters">Hardware & RF</option>
                <option value="Optical Fiber & RF Cables">Optical Fiber</option>
                <option value="Routing & Core Switches">Routing & Switches</option>
                <option value="Cloud & Media Services">Cloud Services</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={loadVendors} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: 12 }}>
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingVendor(null);
                  setVendorForm({
                    name: '',
                    category: 'Hardware & RF Transmitters',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    website: '',
                    status: 'ACTIVE',
                    notes: '',
                    paymentTerms: 'Net 30',
                    logoUrl: '',
                  });
                  setShowVendorModal(true);
                }}
                className="btn btn-pink"
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                <Plus size={14} /> Add New Vendor
              </button>
            </div>
          </div>

          {/* Vendors Table */}
          <div style={{ background: '#ffffff', border: '1px solid #eae4eb', borderRadius: 8, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vendor / Supplier</th>
                    <th>Category</th>
                    <th>Contact Person</th>
                    <th>Email & Phone</th>
                    <th>Payment Terms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#9d8f9e' }}>
                        No vendors found. Click &quot;Add New Vendor&quot; to add a supplier or technology partner.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#2b0d3a', fontSize: 13 }}>{v.name}</div>
                          {v.website && (
                            <a
                              href={v.website}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 11, color: '#e11d72', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                            >
                              {v.website.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                            </a>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>
                            {v.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#2b0d3a' }}>{v.contactPerson || '—'}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: '#2b0d3a' }}>{v.email}</div>
                          {v.phone && <div style={{ fontSize: 11, color: '#7b6f84' }}>{v.phone}</div>}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, color: '#2b0d3a', fontWeight: 600 }}>{v.paymentTerms}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: v.status === 'ACTIVE' ? '#f0fdf4' : '#fffbeb',
                              color: v.status === 'ACTIVE' ? '#16a34a' : '#d97706',
                            }}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEmailModalRecipient({ email: v.email, name: v.contactPerson || v.name });
                                setEmailSubject(`Purchase Order / Inquiry — ${v.name}`);
                                setEmailBody(`Hello ${v.contactPerson || v.name},\n\nWe are requesting quotation & availability for upcoming hardware deployment.\n\nBest regards,\nProcurement Team, Simulcast`);
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 4,
                                border: '1px solid #e11d72',
                                background: '#fdf2f8',
                                color: '#e11d72',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              title="Send Email from support@simulcast.com.np"
                            >
                              <Mail size={12} /> Email
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditVendorModal(v)}
                              style={{ border: 'none', background: 'transparent', color: '#2b0d3a', cursor: 'pointer', padding: 4 }}
                              title="Edit Vendor"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVendor(v.id, v.name)}
                              style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: 4 }}
                              title="Delete Vendor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT CLIENT */}
      {/* ==================================================== */}
      {showClientModal && (
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
                {editingClient ? `Edit Client: ${editingClient.company}` : 'Add New Client Account'}
              </h3>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#7b6f84' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Company / Organization Name *
                  <input
                    type="text"
                    placeholder="e.g. DishHome Nepal"
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value, name: clientForm.name || e.target.value })}
                    required
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Account Identifier / Title *
                  <input
                    type="text"
                    placeholder="e.g. Dish Media Network Ltd."
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    required
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Billing / Primary Email *
                  <input
                    type="email"
                    placeholder="e.g. engineering@dishhome.com.np"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    required
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Contact Person & Title
                  <input
                    type="text"
                    placeholder="e.g. Bikash Adhikari (VP Tech)"
                    value={clientForm.contactPerson}
                    onChange={(e) => setClientForm({ ...clientForm, contactPerson: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Phone Number
                  <input
                    type="text"
                    placeholder="+977 1 4217000"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Industry / Category
                  <select
                    value={clientForm.industry}
                    onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="Broadcasting & DTH">Broadcasting & DTH</option>
                    <option value="ISP & Telecom">ISP & Telecom</option>
                    <option value="Broadcast Television">Broadcast Television</option>
                    <option value="Telecom & Government">Telecom & Government</option>
                    <option value="Enterprise IT">Enterprise IT</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Website URL
                  <input
                    type="url"
                    placeholder="https://www.dishhome.com.np"
                    value={clientForm.website}
                    onChange={(e) => setClientForm({ ...clientForm, website: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Account Status
                  <select
                    value={clientForm.status}
                    onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as 'ACTIVE' | 'PROSPECT' | 'INACTIVE' })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PROSPECT">PROSPECT</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Office Address
                <input
                  type="text"
                  placeholder="e.g. Chabahil, Kathmandu, Nepal"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Technical Notes & Scope of Contract
                <textarea
                  rows={3}
                  placeholder="e.g. Master playout agreement, 10Gbps optical fiber link, 24/7 SLA"
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowClientModal(false)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-pink" style={{ padding: '8px 20px', fontSize: 12 }}>
                  {editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: ADD / EDIT VENDOR */}
      {/* ==================================================== */}
      {showVendorModal && (
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
                {editingVendor ? `Edit Vendor: ${editingVendor.name}` : 'Add New Vendor / Supplier'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVendorModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#7b6f84' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Vendor / Supplier Name *
                  <input
                    type="text"
                    placeholder="e.g. Rohde & Schwarz"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    required
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Supplier Category
                  <select
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="Hardware & RF Transmitters">Hardware & RF Transmitters</option>
                    <option value="Optical Fiber & RF Cables">Optical Fiber & Cables</option>
                    <option value="Routing & Core Switches">Routing & Core Switches</option>
                    <option value="Cloud & Media Services">Cloud & Media Services</option>
                    <option value="Software & Licenses">Software & Licenses</option>
                    <option value="Logistics & Shipping">Logistics & Shipping</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Orders / Billing Email *
                  <input
                    type="email"
                    placeholder="orders@vendor.com"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    required
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Contact Representative
                  <input
                    type="text"
                    placeholder="e.g. Hans Weber (Regional Sales)"
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Payment Terms
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Advance 100%">100% Advance</option>
                    <option value="Letter of Credit (LC)">Letter of Credit (LC)</option>
                    <option value="Credit Card / Auto-debit">Credit Card / Auto-debit</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Vendor Status
                  <select
                    value={vendorForm.status}
                    onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value as 'ACTIVE' | 'PENDING' | 'INACTIVE' })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Website
                  <input
                    type="url"
                    placeholder="https://www.vendor.com"
                    value={vendorForm.website}
                    onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                  Phone
                  <input
                    type="text"
                    placeholder="+49 89 4129-0"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Procurement Notes & Hardware Catalog
                <textarea
                  rows={3}
                  placeholder="e.g. Authorized distributor for DVB-T2 transmitter spare parts and coax connectors."
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowVendorModal(false)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-pink" style={{ padding: '8px 20px', fontSize: 12 }}>
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: DIRECT EMAIL DISPATCH */}
      {/* ==================================================== */}
      {emailModalRecipient && (
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
              maxWidth: 580,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Dispatch Email</h3>
                <div style={{ fontSize: 12, color: '#7b6f84', marginTop: 2 }}>
                  From: <strong>support@simulcast.com.np</strong> &rarr; To: <strong>{emailModalRecipient.email}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalRecipient(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#7b6f84' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendDirectEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Subject Line
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                  style={{ padding: '8px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#2b0d3a' }}>
                Email Message Body (Markdown or HTML supported)
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  required
                  style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13, lineHeight: 1.5 }}
                />
              </label>

              {emailStatusMsg && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background: emailStatusMsg.ok ? '#f0fdf4' : '#fef2f2',
                    color: emailStatusMsg.ok ? '#16a34a' : '#dc2626',
                    border: `1px solid ${emailStatusMsg.ok ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  {emailStatusMsg.msg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setEmailModalRecipient(null)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                  disabled={emailSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  style={{ padding: '8px 20px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  disabled={emailSending}
                >
                  <Send size={13} /> {emailSending ? 'Sending...' : 'Send from support@simulcast.com.np'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
