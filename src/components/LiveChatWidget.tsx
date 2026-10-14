'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, UserCheck, Bot, Shield, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot' | 'human_agent' | 'system';
  senderName: string;
  content: string;
  createdAt?: string | Date;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'ACTIVE' | 'ESCALATED_HUMAN' | 'CLOSED'>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [showLeadFields, setShowLeadFields] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessionId from storage
  useEffect(() => {
    const stored = localStorage.getItem('simulcast_chat_session');
    if (stored) {
      setSessionId(stored);
      fetchSession(stored);
    } else {
      // Initial greeting
      setMessages([
        {
          sender: 'bot',
          senderName: 'Simulcast Assistant',
          content: 'Hello! Welcome to Simulcast Technologies. How can we help you today with our broadcasting, software, AI automation or IT solutions?',
          createdAt: new Date(),
        },
      ]);
    }
  }, []);

  // Poll for agent responses if session is active/escalated
  useEffect(() => {
    if (!sessionId || !isOpen || status === 'CLOSED') return;
    const interval = setInterval(() => {
      fetchSession(sessionId, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [sessionId, isOpen, status]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  async function fetchSession(id: string, silent = false) {
    try {
      const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.session) {
        setStatus(data.session.status);
        if (data.session.messages) {
          setMessages(data.session.messages);
        }
      }
    } catch (e) {
      if (!silent) console.error('Failed to load chat:', e);
    }
  }

  async function sendMessage(textToSend?: string, isEscalateAction = false) {
    const text = textToSend || inputMessage;
    if (!text.trim() && !isEscalateAction) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      senderName: visitorName || 'You',
      content: text || 'Requested connection with human support engineer',
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          visitorName,
          visitorEmail,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          requestHuman: isEscalateAction,
        }),
      });

      const data = await res.json();
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('simulcast_chat_session', data.sessionId);
      }

      if (data.status) {
        setStatus(data.status);
      }

      if (data.reply) {
        setMessages(prev => [...prev, data.reply]);
      }
    } catch (e) {
      console.error('Failed sending message:', e);
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          senderName: 'System',
          content: 'Unable to reach the server. Please check your connection and try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setIsEscalating(false);
    }
  }

  async function handleHumanHandoff() {
    setIsEscalating(true);
    await sendMessage('I would like to speak directly with a human engineer or support specialist.', true);
  }

  async function handleCloseChat() {
    if (!sessionId) {
      setIsOpen(false);
      return;
    }
    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setStatus('CLOSED');
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          senderName: 'System',
          content: 'This chat session has concluded. Thank you for contacting Simulcast Technologies.',
          createdAt: new Date(),
        },
      ]);
      localStorage.removeItem('simulcast_chat_session');
    } catch (e) {
      console.error(e);
    }
  }

  function handleStartNewChat() {
    localStorage.removeItem('simulcast_chat_session');
    setSessionId(null);
    setStatus('ACTIVE');
    setMessages([
      {
        sender: 'bot',
        senderName: 'Simulcast AI',
        content: 'Hello! How can we assist you with our broadcasting, software or IT engineering solutions?',
        createdAt: new Date(),
      },
    ]);
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="sc-chat-trigger"
        aria-label="Open Simulcast Live Chat & AI Assistant"
      >
        <span className="sc-chat-trigger-icon">
          {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
        </span>
        <span className="sc-chat-trigger-label">
          <strong>Live Support</strong>
          <small>AI & Human</small>
        </span>
        <span className="sc-chat-trigger-pulse" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="sc-chat-window" role="dialog" aria-label="Simulcast Live Chat">
          {/* Header */}
          <div className="sc-chat-header">
            <div className="sc-chat-header-brand">
              <img src="/brand/symbol-light.svg" alt="Simulcast" className="sc-chat-logo" />
              <div>
                <strong>SIMULCAST ASSISTANT</strong>
                <span className="sc-chat-status-indicator">
                  <span className={status === 'ESCALATED_HUMAN' ? 'dot-escalated' : 'dot-active'} />
                  {status === 'ESCALATED_HUMAN'
                    ? 'Support Specialist Standing By'
                    : status === 'CLOSED'
                    ? 'Session Closed'
                    : 'Simulcast Assistant · Online'}
                </span>
              </div>
            </div>
            <div className="sc-chat-header-actions">
              {status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={handleCloseChat}
                  title="End chat session"
                  className="sc-chat-btn-subtle"
                >
                  End Chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="sc-chat-btn-close"
                aria-label="Minimize chat window"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Handoff Banner if not yet escalated */}
          {status === 'ACTIVE' && (
            <div className="sc-chat-handoff-bar">
              <span>Need human assistance?</span>
              <button
                type="button"
                onClick={handleHumanHandoff}
                disabled={isEscalating}
                className="sc-chat-handoff-btn"
              >
                <UserCheck size={14} />
                {isEscalating ? 'Connecting...' : 'Talk to a Representative'}
              </button>
            </div>
          )}

          {status === 'ESCALATED_HUMAN' && (
            <div className="sc-chat-escalated-alert">
              <CheckCircle2 size={15} />
              <span>Connecting with a live specialist. Please stay in the chat.</span>
            </div>
          )}

          {/* Message List */}
          <div className="sc-chat-messages">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              const isAgent = m.sender === 'human_agent';
              const isSystem = m.sender === 'system';

              if (isSystem) {
                return (
                  <div key={idx} className="sc-chat-msg-system">
                    <span>{m.content}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className={`sc-chat-msg-row ${isUser ? 'user-row' : 'agent-row'}`}>
                  {!isUser && (
                    <div className="sc-chat-avatar">
                      {isAgent ? <Shield size={14} /> : <Bot size={14} />}
                    </div>
                  )}
                  <div className={`sc-chat-bubble ${isUser ? 'bubble-user' : isAgent ? 'bubble-agent' : 'bubble-bot'}`}>
                    <div className="sc-chat-bubble-name">
                      {isAgent ? 'Support Specialist' : (m.senderName === 'Simulcast System' ? 'Simulcast Support' : (m.senderName || 'Simulcast Assistant'))}
                    </div>
                    <div className="sc-chat-bubble-text">{m.content}</div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="sc-chat-msg-row agent-row">
                <div className="sc-chat-avatar">
                  <Bot size={14} />
                </div>
                <div className="sc-chat-bubble bubble-bot">
                  <div className="sc-chat-typing">
                    <Loader2 size={14} className="sc-chat-spinner" />
                    <span>Simulcast Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {status === 'ACTIVE' && messages.length <= 2 && (
            <div className="sc-chat-quick-tags">
              {[
                'Broadcast Playout & CG',
                'IPTV / OTT Solutions',
                'Custom Software Platforms',
                'AI Automation in Nepal',
              ].map(tag => (
                <button key={tag} type="button" onClick={() => sendMessage(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Lead Info Accordion */}
          {showLeadFields ? (
            <div className="sc-chat-lead-drawer">
              <div className="sc-chat-lead-header">
                <span>Your contact info (for human follow-up):</span>
                <button type="button" onClick={() => setShowLeadFields(false)}>
                  Close
                </button>
              </div>
              <div className="sc-chat-lead-inputs">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email (e.g. you@company.com)"
                  value={visitorEmail}
                  onChange={e => setVisitorEmail(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="sc-chat-lead-toggle">
              <button type="button" onClick={() => setShowLeadFields(true)}>
                + Add your contact info for email transcript & follow-up
              </button>
            </div>
          )}

          {/* Footer Input */}
          {status !== 'CLOSED' ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                sendMessage();
              }}
              className="sc-chat-input-bar"
            >
              <input
                type="text"
                placeholder={
                  status === 'ESCALATED_HUMAN'
                    ? 'Message human support team...'
                    : 'Ask about broadcasting, software, AI...'
                }
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                aria-label="Send message"
                className="sc-chat-btn-send"
              >
                <Send size={16} />
              </button>
            </form>
          ) : (
            <div className="sc-chat-closed-footer">
              <span>This session has concluded.</span>
              <button type="button" onClick={handleStartNewChat}>
                Start New Chat
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
