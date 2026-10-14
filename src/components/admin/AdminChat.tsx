'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  UserCheck,
  Send,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Bot,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface SessionItem {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorEmail?: string;
  status: 'ACTIVE' | 'ESCALATED_HUMAN' | 'CLOSED';
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: { content: string; createdAt: string; sender: string }[];
}

interface MessageItem {
  id: string;
  sender: 'user' | 'bot' | 'human_agent' | 'system';
  senderName: string;
  content: string;
  createdAt: string;
}

export default function AdminChat() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<{ id: string; status: string; messages: MessageItem[] } | null>(null);
  const [filter, setFilter] = useState<'all' | 'ESCALATED_HUMAN' | 'ACTIVE' | 'CLOSED'>('all');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load & periodic poll
  useEffect(() => {
    loadSessions();
    const interval = setInterval(() => {
      loadSessions(true);
      if (selectedSessionId) {
        loadSessionDetails(selectedSessionId, true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedSessionId, filter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  async function loadSessions(silent = false) {
    if (!silent) setLoading(true);
    try {
      const url = `/api/chat/admin?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (!selectedSessionId && data.sessions?.length > 0) {
          setSelectedSessionId(data.sessions[0].id);
          loadSessionDetails(data.sessions[0].id);
        }
      }
    } catch (err) {
      if (!silent) console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadSessionDetails(sessionId: string, silent = false) {
    try {
      const res = await fetch(`/api/chat/admin?sessionId=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data.session);
      }
    } catch (err) {
      if (!silent) console.error(err);
    }
  }

  function handleSelectSession(id: string) {
    setSelectedSessionId(id);
    loadSessionDetails(id);
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSessionId || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          content: replyText.trim(),
        }),
      });

      if (res.ok) {
        setReplyText('');
        loadSessionDetails(selectedSessionId);
        loadSessions(true);
      }
    } catch (err) {
      console.error(err);
      setNotice('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  async function handleSendTranscript() {
    if (!selectedSessionId) return;
    setNotice('Sending transcript to support@simulcast.com.np...');
    try {
      const res = await fetch('/api/chat/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          action: 'send_transcript',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice('Transcript emailed successfully to support@simulcast.com.np.');
        loadSessionDetails(selectedSessionId);
        loadSessions(true);
      } else {
        setNotice(data.error || 'Failed sending transcript.');
      }
    } catch {
      setNotice('Failed to trigger transcript email.');
    }
  }

  async function updateStatus(newStatus: 'ACTIVE' | 'ESCALATED_HUMAN' | 'CLOSED') {
    if (!selectedSessionId) return;
    try {
      await fetch('/api/chat/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          status: newStatus,
        }),
      });
      loadSessionDetails(selectedSessionId);
      loadSessions(true);
    } catch (err) {
      console.error(err);
    }
  }

  const escalatedCount = sessions.filter(s => s.status === 'ESCALATED_HUMAN').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="admin-heading">
        <div>
          <div className="eyebrow">COMMUNICATION STUDIO / LIVE SUPPORT</div>
          <h1>
            Live Chat Console<span className="admin-pink">.</span>
          </h1>
          <p>Real-time customer messaging, human agent handoffs and automated transcript delivery.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => loadSessions()}
            className="btn btn-outline"
            style={{ minHeight: 40, padding: '0 16px' }}
          >
            <RefreshCw size={14} className={loading ? 'sc-chat-spinner' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Escalation Alert Bar */}
      {escalatedCount > 0 && (
        <div
          style={{
            background: '#fff0f5',
            border: '1px solid #ffd0e2',
            borderLeft: '4px solid #e11d72',
            padding: '14px 20px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#901248' }}>
            <AlertCircle size={20} color="#e11d72" />
            <strong>
              {escalatedCount} visitor{escalatedCount > 1 ? 's' : ''} requesting human support engineer!
            </strong>
          </div>
          <button
            onClick={() => setFilter('ESCALATED_HUMAN')}
            className="btn btn-pink"
            style={{ minHeight: 34, padding: '0 14px', fontSize: 11 }}
          >
            Filter Escalated Chats
          </button>
        </div>
      )}

      {notice && (
        <div className="notice-note" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 20,
          background: '#ffffff',
          border: '1px solid #eae3ec',
          borderRadius: 6,
          overflow: 'hidden',
          minHeight: 680,
        }}
      >
        {/* Left Column: Session List */}
        <div style={{ borderRight: '1px solid #eee5f0', display: 'flex', flexDirection: 'column' }}>
          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #eee5f0',
              background: '#faf8fb',
              padding: '8px 12px',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'ESCALATED_HUMAN', label: `Escalated (${escalatedCount})` },
              { id: 'ACTIVE', label: 'AI Active' },
              { id: 'CLOSED', label: 'Closed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: filter === tab.id ? '#2b0d3a' : 'transparent',
                  color: filter === tab.id ? '#ffffff' : '#695a72',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Session Cards */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sessions.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9d8ea4', fontSize: 13 }}>
                No chat sessions found in this category.
              </div>
            ) : (
              sessions.map(s => {
                const isSelected = s.id === selectedSessionId;
                const isEscalated = s.status === 'ESCALATED_HUMAN';
                const latest = s.messages?.[0]?.content || 'Started chat session';

                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid #f2edf4',
                      cursor: 'pointer',
                      background: isSelected ? '#fbf4f9' : '#ffffff',
                      borderLeft: isSelected ? '4px solid #e11d72' : '4px solid transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#2b0d3a' }}>{s.visitorName}</strong>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 7px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                          background: isEscalated ? '#ffd7e6' : s.status === 'ACTIVE' ? '#e2f7eb' : '#eee8f1',
                          color: isEscalated ? '#bd115b' : s.status === 'ACTIVE' ? '#187b47' : '#73667a',
                        }}
                      >
                        {isEscalated ? 'Human Needed' : s.status}
                      </span>
                    </div>
                    {s.visitorEmail && (
                      <div style={{ fontSize: 11, color: '#766780', marginTop: 2 }}>{s.visitorEmail}</div>
                    )}
                    <p
                      style={{
                        fontSize: 12,
                        color: '#55495e',
                        margin: '6px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {latest}
                    </p>
                    <small style={{ fontSize: 10, color: '#a599ac', display: 'block', marginTop: 6 }}>
                      {new Date(s.updatedAt || s.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Stream & Human Agent Response */}
        {selectedSession ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Bar of Session */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #eee5f0',
                background: '#faf8fb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: 15, color: '#2b0d3a' }}>Session #{selectedSession.id.slice(-6)}</strong>
                <span style={{ fontSize: 12, color: '#7e6f86', marginLeft: 12 }}>
                  Status: <strong style={{ color: selectedSession.status === 'ESCALATED_HUMAN' ? '#e11d72' : '#2b0d3a' }}>{selectedSession.status}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {selectedSession.status !== 'ESCALATED_HUMAN' && (
                  <button
                    onClick={() => updateStatus('ESCALATED_HUMAN')}
                    className="btn btn-outline"
                    style={{ minHeight: 34, padding: '0 12px', fontSize: 11 }}
                  >
                    <UserCheck size={14} /> Assign Human Agent
                  </button>
                )}
                {selectedSession.status !== 'CLOSED' && (
                  <button
                    onClick={handleSendTranscript}
                    className="btn btn-pink"
                    style={{ minHeight: 34, padding: '0 12px', fontSize: 11 }}
                  >
                    <Mail size={14} /> End & Email Transcript
                  </button>
                )}
              </div>
            </div>

            {/* Message History */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                background: '#fbfafc',
              }}
            >
              {selectedSession.messages?.map((msg, i) => {
                const isUser = msg.sender === 'user';
                const isAgent = msg.sender === 'human_agent';
                const isBot = msg.sender === 'bot';

                return (
                  <div
                    key={i}
                    style={{
                      alignSelf: isUser ? 'flex-start' : isAgent ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      display: 'flex',
                      gap: 10,
                      flexDirection: isAgent ? 'row-reverse' : 'row',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: isUser ? '#e11d72' : isAgent ? '#2b0d3a' : '#573d67',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isUser ? <User size={14} /> : isAgent ? <Shield size={14} /> : <Bot size={14} />}
                    </div>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: isAgent ? '#2b0d3a' : isUser ? '#ffffff' : '#f4edf6',
                        color: isAgent ? '#ffffff' : '#221d27',
                        border: isUser ? '1px solid #ebdfee' : 'none',
                        boxShadow: '0 2px 6px rgba(43, 13, 58, 0.04)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: 4,
                          color: isAgent ? '#ffd0e2' : '#887a91',
                        }}
                      >
                        {msg.senderName} ({msg.sender}) · {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar for Support Engineer */}
            <form
              onSubmit={sendReply}
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #eee5f0',
                background: '#ffffff',
                display: 'flex',
                gap: 12,
              }}
            >
              <input
                type="text"
                placeholder="Type reply as Support Engineer..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  border: '1px solid #dcd4e1',
                  borderRadius: 4,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="btn btn-pink"
                style={{ minHeight: 44, padding: '0 20px' }}
              >
                <Send size={15} /> {sending ? 'Sending...' : 'Send to Visitor'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#97889e' }}>
            Select a chat session on the left to inspect conversation and reply.
          </div>
        )}
      </div>
    </div>
  );
}
