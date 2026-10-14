'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import { Palette, Save, Sparkles, Sliders, Check, Eye, Code } from 'lucide-react';

export default function AdminTheme() {
  const [data, setData] = useState<Record<string, any>>({
    primaryColor: '#2b0d3a',
    secondaryColor: '#e11d72',
    heroBgColor: '#f5f7fd',
    heroBadgeText: 'INTEGRATED TECHNOLOGY · BUILT IN NEPAL',
    heroHeadline: 'Technology that connects what matters.',
    heroEmphasis: 'Connected by design.',
    subheadline:
      'From broadcasting and media workflows to AI automation, custom software platforms and connected infrastructure—we engineer dependable technology for a fast-moving world.',
    slogan: 'Integrated Broadcast & Technology Solutions',
    chatGreeting:
      'Hello! Welcome to Simulcast Technologies. How can we help you today with our broadcasting, software, AI automation or IT solutions?',
    supportEmail: 'support@simulcast.com.np',
    escalationEmail: 'info@simulcast.com.np,support@simulcast.com.np',
    customCss: '',
    enableChat: true,
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'brand' | 'hero' | 'chat' | 'css'>('brand');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(res => {
        if (res && !res.error) {
          setData(prev => ({ ...prev, ...res }));
        }
      })
      .catch(() => setMessage('Could not load current theme settings.'));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to save settings');
      setMessage('Brand and theme customizations saved successfully! Public pages are synchronized.');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Could not save theme');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Heading */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">DESIGN SYSTEM / THEME MANAGEMENT</div>
          <h1>
            Brand & Theme Studio<span className="admin-pink">.</span>
          </h1>
          <p>
            Complete visual customization: brand colors, hero content, live chat greeting, and dynamic style rules.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={busy}
          className="btn btn-pink"
          style={{ minHeight: 46, padding: '0 24px' }}
        >
          <Save size={16} /> {busy ? 'Saving...' : 'Save Theme & Styles'}
        </button>
      </div>

      {message && <div className="notice-note">{message}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e7dfeb', paddingBottom: 2 }}>
        {[
          { id: 'brand', label: 'Brand Colors & Swatches', icon: Palette },
          { id: 'hero', label: 'Hero Content & Copy', icon: Sliders },
          { id: 'chat', label: 'Chat & Notification Rules', icon: Sparkles },
          { id: 'css', label: 'Custom CSS Overrides', icon: Code },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
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
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {activeTab === 'brand' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            {/* Color controls */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #eae4eb',
                borderRadius: 6,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#2b0d3a' }}>Brand Color Palette</h3>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#74677c' }}>
                Tune the master brand colors used across headlines, hover corner brackets, buttons and gradients.
              </p>

              {/* Primary Color */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f2edf4' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#2b0d3a' }}>Primary Brand Color (Deep Purple)</strong>
                  <span style={{ fontSize: 11, color: '#8d8095' }}>Used on main titles, navigation, and top-left hover brackets</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={data.primaryColor || '#2b0d3a'}
                    onChange={e => setData({ ...data, primaryColor: e.target.value })}
                    style={{ width: 44, height: 38, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={data.primaryColor || ''}
                    onChange={e => setData({ ...data, primaryColor: e.target.value })}
                    style={{ width: 90, padding: '8px 10px', fontSize: 12, border: '1px solid #dcd4e1', borderRadius: 4 }}
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f2edf4' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#2b0d3a' }}>Secondary Brand Color (Vibrant Pink)</strong>
                  <span style={{ fontSize: 11, color: '#8d8095' }}>Used on action buttons, accent words, and bottom-right brackets</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={data.secondaryColor || '#e11d72'}
                    onChange={e => setData({ ...data, secondaryColor: e.target.value })}
                    style={{ width: 44, height: 38, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={data.secondaryColor || ''}
                    onChange={e => setData({ ...data, secondaryColor: e.target.value })}
                    style={{ width: 90, padding: '8px 10px', fontSize: 12, border: '1px solid #dcd4e1', borderRadius: 4 }}
                  />
                </div>
              </div>

              {/* Hero Background Color */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#2b0d3a' }}>Hero Background Hue (White-Bluish)</strong>
                  <span style={{ fontSize: 11, color: '#8d8095' }}>Calibrated to match the futuristic hub image background</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={data.heroBgColor || '#f5f7fd'}
                    onChange={e => setData({ ...data, heroBgColor: e.target.value })}
                    style={{ width: 44, height: 38, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={data.heroBgColor || ''}
                    onChange={e => setData({ ...data, heroBgColor: e.target.value })}
                    style={{ width: 90, padding: '8px 10px', fontSize: 12, border: '1px solid #dcd4e1', borderRadius: 4 }}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div
              style={{
                background: data.heroBgColor || '#f5f7fd',
                border: '1px solid #eae4eb',
                borderRadius: 8,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 8px 24px rgba(43, 13, 58, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: data.primaryColor }}>
                <Eye size={16} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' }}>LIVE COLOR THEME PREVIEW</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 24, color: data.primaryColor, fontWeight: 700, lineHeight: 1.2 }}>
                Technology that connects what matters.<br />
                <span style={{ color: data.secondaryColor }}>Connected by design.</span>
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#665970', lineHeight: 1.6 }}>
                Real-time preview of how text accents, primary headlines, and call-to-actions render together.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  style={{
                    background: data.secondaryColor,
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Explore solutions →
                </button>
                <button
                  type="button"
                  style={{
                    background: '#fff',
                    color: data.primaryColor,
                    border: `1px solid ${data.primaryColor}`,
                    padding: '10px 18px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Discuss project
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eae4eb',
              borderRadius: 6,
              padding: 28,
              display: 'grid',
              gap: 20,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Homepage Hero Section Copy & Identity</h3>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Hero Top Pill Badge Text
              <input
                type="text"
                value={data.heroBadgeText || ''}
                onChange={e => setData({ ...data, heroBadgeText: e.target.value })}
                style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Hero Headline (Line 1)
              <input
                type="text"
                value={data.headline || ''}
                onChange={e => setData({ ...data, headline: e.target.value })}
                style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Hero Headline Accent (Line 2 Gradient Emphasis)
              <input
                type="text"
                value={data.heroEmphasis || ''}
                onChange={e => setData({ ...data, heroEmphasis: e.target.value })}
                style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Hero Subheadline / Lead Paragraph
              <textarea
                rows={3}
                value={data.subheadline || ''}
                onChange={e => setData({ ...data, subheadline: e.target.value })}
                style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13, resize: 'vertical' }}
              />
            </label>
          </div>
        )}

        {activeTab === 'chat' && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eae4eb',
              borderRadius: 6,
              padding: 28,
              display: 'grid',
              gap: 20,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Live Chat & Human Handoff Notification Config</h3>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#2b0d3a', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={data.enableChat !== false}
                onChange={e => setData({ ...data, enableChat: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#e11d72' }}
              />
              Enable Live Chat Widget on Public Website
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              AI Welcome Greeting (Shown when visitor opens chat)
              <textarea
                rows={2}
                value={data.chatGreeting || ''}
                onChange={e => setData({ ...data, chatGreeting: e.target.value })}
                style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13, resize: 'vertical' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Human Support Alert Notification Recipients (Comma-separated)
              <input
                type="text"
                value={data.escalationEmail || 'info@simulcast.com.np,support@simulcast.com.np'}
                onChange={e => setData({ ...data, escalationEmail: e.target.value })}
                style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: '#887b8f' }}>
                When a user asks to talk with a human, immediate email alerts are dispatched to these addresses.
              </span>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#2b0d3a', fontWeight: 700 }}>
              Chat Transcript Recipient Email (Sent at end of chat)
              <input
                type="email"
                value={data.supportEmail || 'support@simulcast.com.np'}
                onChange={e => setData({ ...data, supportEmail: e.target.value })}
                style={{ padding: '10px 12px', border: '1px solid #dcd4e1', borderRadius: 4, fontSize: 13 }}
              />
            </label>
          </div>
        )}

        {activeTab === 'css' && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eae4eb',
              borderRadius: 6,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: '#2b0d3a' }}>Global Custom CSS Injection</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#74677c' }}>
              Add custom CSS rules that will be injected directly into the document root of the website for custom style overrides.
            </p>
            <textarea
              rows={12}
              value={data.customCss || ''}
              onChange={e => setData({ ...data, customCss: e.target.value })}
              placeholder="/* Example: .sc-hero-headline { letter-spacing: -0.04em; } */"
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                padding: '14px',
                border: '1px solid #dcd4e1',
                borderRadius: 4,
                background: '#1a1422',
                color: '#e7d8f0',
                resize: 'vertical',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="submit" disabled={busy} className="btn btn-pink" style={{ minHeight: 46, padding: '0 28px' }}>
            <Save size={16} /> {busy ? 'Saving customizations...' : 'Save Website Customizations'}
          </button>
        </div>
      </form>
    </div>
  );
}
