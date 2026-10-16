"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Mail,
  Send,
  Inbox,
  FileEdit,
  AlertTriangle,
  Trash2,
  Star,
  RefreshCw,
  Search,
  Plus,
  Paperclip,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Server,
  Settings,
  Clock,
  CornerUpLeft,
  CornerUpRight,
  User,
  ExternalLink,
} from "lucide-react";

export interface MailAccount {
  id: string;
  name: string;
  email: string;
  isDefault: boolean;
  status: "ACTIVE" | "DISABLED" | "ERROR";
  incomingType: "IMAP" | "POP3";
  incomingHost: string;
  incomingPort: number;
  incomingSecure: boolean;
  incomingUser: string;
  incomingPass: string;
  outgoingHost: string;
  outgoingPort: number;
  outgoingSecure: boolean;
  outgoingUser: string;
  outgoingPass: string;
  signature: string;
  color: string;
  syncInterval: number;
  lastSyncAt: string | null;
}

export interface WebmailAttachment {
  id?: string;
  filename: string;
  size?: number;
  contentType?: string;
  url?: string;
  path?: string;
  contentBase64?: string;
}

export interface WebmailMessage {
  id: string;
  accountId: string;
  accountEmail: string;
  folder: "INBOX" | "SENT" | "DRAFTS" | "FAILED" | "TRASH" | "ARCHIVE";
  from: string;
  fromEmail: string;
  to: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  snippet: string;
  bodyHtml: string;
  bodyText?: string | null;
  attachments?: WebmailAttachment[];
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  messageId?: string | null;
  date: string;
}

export default function AdminWebmail({
  initialView = "webmail",
}: {
  initialView?: "webmail" | "accounts";
}) {
  const [subView, setSubView] = useState<"webmail" | "accounts">(initialView);

  // Accounts state
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>("ALL");
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Webmail state
  const [messages, setMessages] = useState<WebmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WebmailMessage | null>(null);
  const [activeFolder, setActiveFolder] = useState<"INBOX" | "SENT" | "DRAFTS" | "FAILED" | "TRASH" | "STARRED">("INBOX");
  const [filterMode, setFilterMode] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Folder Counts
  const [counts, setCounts] = useState({
    inboxUnread: 0,
    inboxTotal: 0,
    sentTotal: 0,
    draftsTotal: 0,
    failedTotal: 0,
    trashTotal: 0,
    starredTotal: 0,
  });

  // Compose Modal State
  const [showCompose, setShowCompose] = useState(false);
  const [composeFrom, setComposeFrom] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<WebmailAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Account Modal State (Add / Edit)
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<MailAccount> | null>(null);
  const [accountFormData, setAccountFormData] = useState<Partial<MailAccount>>({
    name: "",
    email: "",
    incomingType: "IMAP",
    incomingHost: "mail.simulcast.com.np",
    incomingPort: 993,
    incomingSecure: true,
    incomingUser: "",
    incomingPass: "",
    outgoingHost: "mail.simulcast.com.np",
    outgoingPort: 587,
    outgoingSecure: false,
    outgoingUser: "",
    outgoingPass: "",
    signature: "",
    color: "#e11d72",
    isDefault: false,
  });
  const [testingConnection, setTestingConnection] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [selectedAccountEmail, activeFolder, filterMode]);

  async function loadAccounts() {
    setLoadingAccounts(true);
    try {
      const res = await fetch("/api/admin/webmail/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0 && !composeFrom) {
          const defaultAcc = data.accounts.find((a: MailAccount) => a.isDefault) || data.accounts[0];
          setComposeFrom(defaultAcc.email);
        }
      }
    } catch {
      toast.error("Failed to load email accounts");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function loadMessages() {
    setLoadingMessages(true);
    try {
      const folderParam = activeFolder === "STARRED" ? "ALL" : activeFolder;
      const filterParam = activeFolder === "STARRED" ? "STARRED" : filterMode;
      const accountParam = selectedAccountEmail;

      const url = `/api/admin/webmail/messages?folder=${folderParam}&filter=${filterParam}&accountEmail=${encodeURIComponent(
        accountParam
      )}&search=${encodeURIComponent(searchQuery)}&limit=100`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const loadedMessages = data.messages || [];
        setMessages(loadedMessages);
        if (data.counts) setCounts(data.counts);

        if (selectedMessage) {
          const updated = loadedMessages.find((m: WebmailMessage) => m.id === selectedMessage.id);
          if (updated) setSelectedMessage(updated);
        }

        // If inbox is empty on initial load, auto-sync in background so user sees incoming inquiries immediately
        if (loadedMessages.length === 0 && activeFolder === "INBOX" && !searchQuery) {
          fetch("/api/admin/webmail/sync", { method: "POST" })
            .then((r) => r.json())
            .then((syncData) => {
              if (syncData.synced > 0) {
                loadMessages();
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSyncMailbox() {
    setSyncing(true);
    const toastId = toast.loading("Synchronizing mailbox with server...");
    try {
      const res = await fetch("/api/admin/webmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountEmail: selectedAccountEmail === "ALL" ? undefined : selectedAccountEmail }),
      });
      const data = await res.json();
      toast.success(data.message || "Mailbox synchronized successfully", { id: toastId });
      await loadMessages();
      await loadAccounts();
    } catch {
      toast.error("Failed to synchronize mailbox", { id: toastId });
    } finally {
      setSyncing(false);
    }
  }

  async function handleSelectMessage(msg: WebmailMessage) {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
      setCounts((prev) => ({ ...prev, inboxUnread: Math.max(0, prev.inboxUnread - 1) }));
      await fetch(`/api/admin/webmail/messages/${msg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    }
  }

  async function handleToggleStar(msg: WebmailMessage, e: React.MouseEvent) {
    e.stopPropagation();
    const newStar = !msg.isStarred;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isStarred: newStar } : m)));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage((prev) => (prev ? { ...prev, isStarred: newStar } : null));
    }
    await fetch(`/api/admin/webmail/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isStarred: newStar }),
    });
    toast.success(newStar ? "Email flagged as Starred" : "Removed Star", { duration: 1500 });
  }

  async function handleToggleRead(msg: WebmailMessage, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const newRead = !msg.isRead;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: newRead } : m)));
    setCounts((prev) => ({
      ...prev,
      inboxUnread: newRead ? Math.max(0, prev.inboxUnread - 1) : prev.inboxUnread + 1,
    }));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage((prev) => (prev ? { ...prev, isRead: newRead } : null));
    }
    await fetch(`/api/admin/webmail/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: newRead }),
    });
    toast.success(newRead ? "Marked as read" : "Marked as unread", { duration: 1500 });
  }

  async function handleDeleteMessage(msg: WebmailMessage) {
    const permanent = msg.folder === "TRASH";
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    if (selectedMessage?.id === msg.id) setSelectedMessage(null);

    await fetch(`/api/admin/webmail/messages/${msg.id}?permanent=${permanent}`, {
      method: "DELETE",
    });
    toast.success(permanent ? "Email permanently deleted" : "Email moved to Trash");
    loadMessages();
  }

  function handleOpenCompose(replyToMsg?: WebmailMessage, isForward = false) {
    setCurrentDraftId(null);
    if (replyToMsg) {
      setComposeFrom(replyToMsg.accountEmail);
      if (isForward) {
        setComposeTo("");
        setComposeSubject(`Fwd: ${replyToMsg.subject.replace(/^Fwd:\s*/i, "")}`);
        setComposeBody(
          `<br/><br/>-------- Forwarded Message --------<br/><strong>From:</strong> ${replyToMsg.from}<br/><strong>Date:</strong> ${new Date(
            replyToMsg.date
          ).toLocaleString()}<br/><strong>Subject:</strong> ${replyToMsg.subject}<br/><strong>To:</strong> ${replyToMsg.to}<br/><br/>${replyToMsg.bodyHtml}`
        );
      } else {
        setComposeTo(replyToMsg.fromEmail || replyToMsg.from);
        setComposeSubject(`Re: ${replyToMsg.subject.replace(/^Re:\s*/i, "")}`);
        setComposeBody(
          `<br/><br/>On ${new Date(replyToMsg.date).toLocaleString()}, ${replyToMsg.from} wrote:<br/><blockquote style="margin:0 0 0 0.8ex;border-left:2px #e11d72 solid;padding-left:1ex">${replyToMsg.bodyHtml}</blockquote>`
        );
      }
      setComposeAttachments(replyToMsg.attachments || []);
    } else {
      setComposeTo("");
      setComposeCc("");
      setComposeBcc("");
      setComposeSubject("");
      setComposeBody("");
      setComposeAttachments([]);
    }
    setShowCompose(true);
  }

  function handleOpenDraft(draftMsg: WebmailMessage) {
    setCurrentDraftId(draftMsg.id);
    setComposeFrom(draftMsg.accountEmail);
    setComposeTo(draftMsg.to);
    setComposeCc(draftMsg.cc || "");
    setComposeBcc(draftMsg.bcc || "");
    if (draftMsg.cc) setShowCc(true);
    setComposeSubject(draftMsg.subject);
    setComposeBody(draftMsg.bodyHtml);
    setComposeAttachments(draftMsg.attachments || []);
    setShowCompose(true);
  }

  async function handleSendWebmail() {
    if (!composeTo.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    if (!composeSubject.trim()) {
      toast.error("Please enter a subject line.");
      return;
    }

    setSending(true);
    const toastId = toast.loading(`Sending email from ${composeFrom}...`);
    try {
      const res = await fetch("/api/admin/webmail/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccount: composeFrom,
          to: composeTo.trim(),
          cc: composeCc.trim() || undefined,
          bcc: composeBcc.trim() || undefined,
          subject: composeSubject.trim(),
          bodyHtml: composeBody,
          attachments: composeAttachments,
          draftId: currentDraftId || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success(`Email dispatched to ${composeTo}!`, { id: toastId });
        setShowCompose(false);
        loadMessages();
      } else {
        toast.error(`Delivery notice: ${data.error || "Recorded in Failed folder"}`, { id: toastId });
        setShowCompose(false);
        loadMessages();
      }
    } catch {
      toast.error("Network error while dispatching email", { id: toastId });
    } finally {
      setSending(false);
    }
  }

  async function handleSaveDraft() {
    setSending(true);
    const toastId = toast.loading("Saving draft...");
    try {
      const res = await fetch("/api/admin/webmail/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draft",
          id: currentDraftId || undefined,
          fromAccount: composeFrom,
          to: composeTo.trim(),
          cc: composeCc.trim() || undefined,
          bcc: composeBcc.trim() || undefined,
          subject: composeSubject.trim() || "Untitled Draft",
          bodyHtml: composeBody,
          attachments: composeAttachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentDraftId(data.draft.id);
        toast.success("Draft saved", { id: toastId });
        loadMessages();
      } else {
        toast.error(data.error || "Failed to save draft", { id: toastId });
      }
    } catch {
      toast.error("Failed to save draft", { id: toastId });
    } finally {
      setSending(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setComposeAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
            contentBase64: base64,
          },
        ]);
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveAttachment(idx: number) {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Attachment removed");
  }

  function handleOpenAddAccount() {
    setEditingAccount(null);
    setAccountFormData({
      name: "",
      email: "",
      incomingType: "IMAP",
      incomingHost: "mail.simulcast.com.np",
      incomingPort: 993,
      incomingSecure: true,
      incomingUser: "",
      incomingPass: "",
      outgoingHost: "mail.simulcast.com.np",
      outgoingPort: 587,
      outgoingSecure: false,
      outgoingUser: "",
      outgoingPass: "",
      signature: "",
      color: "#e11d72",
      isDefault: false,
    });
    setShowAccountModal(true);
  }

  function handleOpenEditAccount(acc: MailAccount) {
    setEditingAccount(acc);
    setAccountFormData({ ...acc });
    setShowAccountModal(true);
  }

  async function handleTestAccountConnection() {
    setTestingConnection(true);
    const toastId = toast.loading(`Testing connection for ${accountFormData.email || "server"}...`);
    try {
      const res = await fetch("/api/admin/webmail/accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountFormData),
      });
      const data = await res.json();
      if (data.smtpStatus === "CONNECTED") {
        toast.success(`SMTP & IMAP Connected: ${data.smtpMessage}`, { id: toastId, duration: 5000 });
      } else {
        toast.error(`SMTP Warning: ${data.smtpMessage}`, { id: toastId, duration: 6000 });
      }
    } catch {
      toast.error("Failed to connect to mail server.", { id: toastId });
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleSaveAccount() {
    if (!accountFormData.email || !accountFormData.name) {
      toast.error("Please enter Account Name and Email Address.");
      return;
    }

    const toastId = toast.loading("Saving mail account...");
    try {
      const res = await fetch("/api/admin/webmail/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...accountFormData,
          id: editingAccount?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Account ${accountFormData.email} saved successfully!`, { id: toastId });
        setShowAccountModal(false);
        loadAccounts();
      } else {
        toast.error(data.error || "Failed to save account", { id: toastId });
      }
    } catch {
      toast.error("Network error while saving account", { id: toastId });
    }
  }

  async function handleDeleteAccount(acc: MailAccount) {
    if (!confirm(`Delete email account ${acc.email}?`)) return;
    const toastId = toast.loading(`Deleting account ${acc.email}...`);
    try {
      const res = await fetch(`/api/admin/webmail/accounts?id=${acc.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Account ${acc.email} deleted`, { id: toastId });
        loadAccounts();
      } else {
        toast.error("Failed to delete account", { id: toastId });
      }
    } catch {
      toast.error("Network error while deleting account", { id: toastId });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub navigation aligned with admin theme */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSubView("webmail")}
            className={`btn btn-sm ${subView === "webmail" ? "btn-pink" : "btn-outline"}`}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Inbox size={15} /> Webmail Client
          </button>
          <button
            onClick={() => setSubView("accounts")}
            className={`btn btn-sm ${subView === "accounts" ? "btn-pink" : "btn-outline"}`}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Server size={15} /> Configured Mailboxes ({accounts.length})
          </button>
        </div>

        {subView === "webmail" ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={handleSyncMailbox}
              className="btn btn-sm btn-outline"
              disabled={syncing}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} className={syncing ? "spin-icon" : ""} />
              {syncing ? "Syncing..." : "Sync Mailbox"}
            </button>
            <button
              onClick={() => handleOpenCompose()}
              className="btn btn-sm btn-pink"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <FileEdit size={15} /> Compose Email
            </button>
          </div>
        ) : (
          <button
            onClick={handleOpenAddAccount}
            className="btn btn-sm btn-pink"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={15} /> Add Mail Account
          </button>
        )}
      </div>

      {/* VIEW 1: WEBMAIL CLIENT */}
      {subView === "webmail" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 360px 1fr",
            gap: 16,
            minHeight: 680,
            background: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e8e2ec",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(43, 13, 58, 0.04)",
          }}
        >
          {/* COLUMN 1: SIDEBAR */}
          <div
            style={{
              background: "#faf8fb",
              borderRight: "1px solid #e8e2ec",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Account Switcher */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7b6f84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Active Mailbox
              </div>
              <select
                className="admin-input"
                value={selectedAccountEmail}
                onChange={(e) => {
                  setSelectedAccountEmail(e.target.value);
                  setSelectedMessage(null);
                }}
                style={{ width: "100%", padding: "7px 10px", fontSize: 13, fontWeight: 600, background: "#ffffff" }}
              >
                <option value="ALL">All Inboxes (Unified)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Folders */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7b6f84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Folders
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  onClick={() => {
                    setActiveFolder("INBOX");
                    setSelectedMessage(null);
                  }}
                  style={{
                    background: activeFolder === "INBOX" ? "#f3e8f4" : "transparent",
                    border: "none",
                    borderLeft: activeFolder === "INBOX" ? "3px solid #e11d72" : "3px solid transparent",
                    padding: "9px 12px",
                    borderRadius: "0 6px 6px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeFolder === "INBOX" ? 700 : 500,
                    color: activeFolder === "INBOX" ? "#e11d72" : "#2b0d3a",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Inbox size={16} /> Inbox
                  </span>
                  {counts.inboxUnread > 0 ? (
                    <span style={{ background: "#e11d72", color: "#fff", fontSize: 11, padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>
                      {counts.inboxUnread}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#8a7a97" }}>{counts.inboxTotal}</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveFolder("SENT");
                    setSelectedMessage(null);
                  }}
                  style={{
                    background: activeFolder === "SENT" ? "#f3e8f4" : "transparent",
                    border: "none",
                    borderLeft: activeFolder === "SENT" ? "3px solid #e11d72" : "3px solid transparent",
                    padding: "9px 12px",
                    borderRadius: "0 6px 6px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeFolder === "SENT" ? 700 : 500,
                    color: activeFolder === "SENT" ? "#e11d72" : "#2b0d3a",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Send size={16} /> Sent
                  </span>
                  <span style={{ fontSize: 11, color: "#8a7a97" }}>{counts.sentTotal}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveFolder("DRAFTS");
                    setSelectedMessage(null);
                  }}
                  style={{
                    background: activeFolder === "DRAFTS" ? "#f3e8f4" : "transparent",
                    border: "none",
                    borderLeft: activeFolder === "DRAFTS" ? "3px solid #e11d72" : "3px solid transparent",
                    padding: "9px 12px",
                    borderRadius: "0 6px 6px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeFolder === "DRAFTS" ? 700 : 500,
                    color: activeFolder === "DRAFTS" ? "#e11d72" : "#2b0d3a",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileEdit size={16} /> Drafts
                  </span>
                  <span style={{ fontSize: 11, color: "#8a7a97" }}>{counts.draftsTotal}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveFolder("FAILED");
                    setSelectedMessage(null);
                  }}
                  style={{
                    background: activeFolder === "FAILED" ? "#f3e8f4" : "transparent",
                    border: "none",
                    borderLeft: activeFolder === "FAILED" ? "3px solid #ef4444" : "3px solid transparent",
                    padding: "9px 12px",
                    borderRadius: "0 6px 6px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeFolder === "FAILED" ? 700 : 500,
                    color: activeFolder === "FAILED" ? "#ef4444" : "#2b0d3a",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} color="#ef4444" /> Failed
                  </span>
                  {counts.failedTotal > 0 ? (
                    <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>
                      {counts.failedTotal}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#8a7a97" }}>0</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveFolder("STARRED");
                    setSelectedMessage(null);
                  }}
                  style={{
                    background: activeFolder === "STARRED" ? "#f3e8f4" : "transparent",
                    border: "none",
                    borderLeft: activeFolder === "STARRED" ? "3px solid #f59e0b" : "3px solid transparent",
                    padding: "9px 12px",
                    borderRadius: "0 6px 6px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeFolder === "STARRED" ? 700 : 500,
                    color: activeFolder === "STARRED" ? "#b45309" : "#2b0d3a",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Star size={16} color="#f59e0b" /> Starred
                  </span>
                  <span style={{ fontSize: 11, color: "#8a7a97" }}>{counts.starredTotal}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveFolder("TRASH");
                    setSelectedMessage(null);
                  }}
                  style={{
                    background: activeFolder === "TRASH" ? "#f3e8f4" : "transparent",
                    border: "none",
                    borderLeft: activeFolder === "TRASH" ? "3px solid #6d6975" : "3px solid transparent",
                    padding: "9px 12px",
                    borderRadius: "0 6px 6px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: activeFolder === "TRASH" ? 700 : 500,
                    color: activeFolder === "TRASH" ? "#6d6975" : "#2b0d3a",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Trash2 size={16} /> Trash
                  </span>
                  <span style={{ fontSize: 11, color: "#8a7a97" }}>{counts.trashTotal}</span>
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7b6f84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Filter
              </div>
              <div style={{ display: "flex", gap: 4, background: "#eae3ed", padding: 3, borderRadius: 6 }}>
                {(["ALL", "UNREAD", "READ"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    style={{
                      flex: 1,
                      border: "none",
                      background: filterMode === mode ? "#ffffff" : "transparent",
                      color: filterMode === mode ? "#2b0d3a" : "#7b6f84",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "5px 0",
                      borderRadius: 4,
                      cursor: "pointer",
                      boxShadow: filterMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {mode === "ALL" ? "All" : mode === "UNREAD" ? "Unread" : "Read"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: EMAIL LIST */}
          <div
            style={{
              borderRight: "1px solid #e8e2ec",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Search bar */}
            <div style={{ padding: 12, borderBottom: "1px solid #e8e2ec", display: "flex", gap: 8, alignItems: "center" }}>
              <div className="admin-search" style={{ flex: 1, margin: 0 }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search subject, sender, body..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadMessages()}
                />
              </div>
              <button
                onClick={() => loadMessages()}
                className="btn btn-outline"
                style={{ padding: "7px 10px" }}
                title="Refresh list"
              >
                <RefreshCw size={14} className={loadingMessages ? "spin-icon" : ""} />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadingMessages ? (
                <div style={{ padding: 32, textAlign: "center", color: "#6d6975" }}>
                  <RefreshCw size={20} className="spin-icon" style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: 13 }}>Loading emails...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "#8a7a97" }}>
                  <Mail size={36} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#2b0d3a" }}>No emails in this mailbox</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                    Sent emails and incoming contact inquiries will appear here automatically.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isUnread = !msg.isRead;

                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        if (msg.folder === "DRAFTS") {
                          handleOpenDraft(msg);
                        } else {
                          handleSelectMessage(msg);
                        }
                      }}
                      style={{
                        padding: "12px 14px",
                        borderBottom: "1px solid #f0eaf2",
                        background: isSelected ? "#f9eff7" : isUnread ? "#ffffff" : "#fdfcfe",
                        borderLeft: isSelected ? "3px solid #e11d72" : "3px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        transition: "background 0.15s",
                      }}
                    >
                      {isUnread && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#e11d72",
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isUnread ? 800 : 600,
                              color: isUnread ? "#2b0d3a" : "#4a3c57",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 180,
                            }}
                          >
                            {msg.folder === "SENT" || msg.folder === "DRAFTS" ? `To: ${msg.to}` : msg.from}
                          </span>
                          <span style={{ fontSize: 11, color: "#8a7a97", flexShrink: 0 }}>
                            {new Date(msg.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: isUnread ? 700 : 500,
                            color: isUnread ? "#2b0d3a" : "#6d6975",
                            marginBottom: 3,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {msg.isStarred && <Star size={12} color="#f59e0b" fill="#f59e0b" style={{ display: "inline", marginRight: 4 }} />}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <Paperclip size={12} style={{ display: "inline", marginRight: 4, color: "#e11d72" }} />
                          )}
                          {msg.subject || "(No Subject)"}
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            color: "#8a7a97",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {msg.snippet || "(No content preview)"}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleToggleStar(msg, e)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: msg.isStarred ? "#f59e0b" : "#d1c7d8",
                          padding: 2,
                        }}
                        title={msg.isStarred ? "Remove Star" : "Star"}
                      >
                        <Star size={14} fill={msg.isStarred ? "#f59e0b" : "none"} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: READING PANE */}
          <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", overflow: "hidden" }}>
            {!selectedMessage ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#8a7a97", padding: 40, textAlign: "center" }}>
                <Mail size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
                <h3 style={{ margin: 0, fontSize: 16, color: "#2b0d3a", fontWeight: 700 }}>Select an email to view</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, maxWidth: 300, lineHeight: 1.5 }}>
                  Choose any conversation from the list to view its complete headers, attachments, and formatted message body.
                </p>
              </div>
            ) : (
              <>
                {/* TOOLBAR */}
                <div
                  style={{
                    padding: "10px 18px",
                    borderBottom: "1px solid #e8e2ec",
                    background: "#faf8fb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleOpenCompose(selectedMessage, false)} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12 }}>
                      <CornerUpLeft size={14} /> Reply
                    </button>
                    <button onClick={() => handleOpenCompose(selectedMessage, true)} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12 }}>
                      <CornerUpRight size={14} /> Forward
                    </button>
                    <button onClick={() => handleToggleRead(selectedMessage)} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12 }}>
                      <Eye size={14} /> {selectedMessage.isRead ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button onClick={(e) => handleToggleStar(selectedMessage, e)} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12 }}>
                      <Star size={14} fill={selectedMessage.isStarred ? "#f59e0b" : "none"} color={selectedMessage.isStarred ? "#f59e0b" : "currentColor"} />
                      {selectedMessage.isStarred ? "Starred" : "Star"}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteMessage(selectedMessage)}
                    className="btn btn-outline"
                    style={{ padding: "6px 12px", fontSize: 12, color: "#b91c1c", borderColor: "#fecaca" }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                {/* CONTENT */}
                <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                  <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, color: "#2b0d3a" }}>
                    {selectedMessage.subject || "(No Subject)"}
                  </h2>

                  <div
                    style={{
                      background: "#faf8fb",
                      border: "1px solid #e8e2ec",
                      borderRadius: 8,
                      padding: "14px 18px",
                      marginBottom: 20,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#2b0d3a" }}>{selectedMessage.from}</div>
                      <div style={{ fontSize: 12, color: "#6d6975", marginTop: 2 }}>
                        <strong>To:</strong> {selectedMessage.to}
                        {selectedMessage.cc && ` | CC: ${selectedMessage.cc}`}
                      </div>
                      <div style={{ fontSize: 12, color: "#8a7a97", marginTop: 2 }}>
                        <strong>Account:</strong> {selectedMessage.accountEmail}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", fontSize: 12, color: "#6d6975" }}>
                      <div>{new Date(selectedMessage.date).toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</div>
                      <div style={{ marginTop: 2 }}>{new Date(selectedMessage.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>

                  {/* BODY */}
                  <div
                    style={{
                      padding: 20,
                      background: "#ffffff",
                      border: "1px solid #eee5f0",
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#33263a",
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml || selectedMessage.bodyText || "" }}
                  />

                  {/* ATTACHMENTS */}
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div style={{ marginTop: 20, padding: 14, background: "#faf8fb", border: "1px solid #e8e2ec", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#2b0d3a", display: "flex", alignItems: "center", gap: 6 }}>
                        <Paperclip size={14} color="#e11d72" />
                        Attachments ({selectedMessage.attachments.length})
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginTop: 10 }}>
                        {selectedMessage.attachments.map((att, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e8e2ec",
                              borderRadius: 6,
                              padding: "8px 12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 12,
                            }}
                          >
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
                              {att.filename}
                            </span>
                            {att.size && <span style={{ color: "#8a7a97", fontSize: 11 }}>{Math.round(att.size / 1024)} KB</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SERVER & ACCOUNTS SETUP */}
      {subView === "accounts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 16,
            }}
          >
            {accounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e8e2ec",
                  borderRadius: 8,
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 2px 10px rgba(43, 13, 58, 0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2b0d3a" }}>{acc.name}</h3>
                    <div style={{ fontSize: 13, color: "#e11d72", fontWeight: 600 }}>{acc.email}</div>
                  </div>
                  {acc.isDefault && (
                    <span className="admin-pill" style={{ background: "#fdf2f8", color: "#e11d72", border: "1px solid #fbcfe8" }}>
                      PRIMARY
                    </span>
                  )}
                </div>

                <div
                  style={{
                    background: "#faf8fb",
                    border: "1px solid #f0eaf2",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    color: "#54465e",
                  }}
                >
                  <div>
                    <strong>Incoming ({acc.incomingType}):</strong> {acc.incomingHost}:{acc.incomingPort} (SSL: {acc.incomingSecure ? "Yes" : "No"})
                  </div>
                  <div>
                    <strong>Outgoing (SMTP):</strong> {acc.outgoingHost}:{acc.outgoingPort} (SSL: {acc.outgoingSecure ? "Yes" : "No"})
                  </div>
                  <div>
                    <strong>Sync:</strong> Every {acc.syncInterval} mins | Last sync:{" "}
                    {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleTimeString() : "Never"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <button onClick={() => handleOpenEditAccount(acc)} className="btn btn-outline" style={{ fontSize: 12, padding: "6px 12px" }}>
                    <Settings size={13} /> Edit Credentials
                  </button>
                  <button
                    onClick={async () => {
                      const toastId = toast.loading(`Testing ${acc.email}...`);
                      const res = await fetch("/api/admin/webmail/accounts/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(acc),
                      });
                      const data = await res.json();
                      if (data.smtpStatus === "CONNECTED") {
                        toast.success(`Connected! ${data.smtpMessage}`, { id: toastId, duration: 4000 });
                      } else {
                        toast.error(`SMTP warning: ${data.smtpMessage}`, { id: toastId, duration: 5000 });
                      }
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    <CheckCircle2 size={13} /> Test Connection
                  </button>
                  <button onClick={() => handleDeleteAccount(acc)} className="btn btn-outline" style={{ color: "#b91c1c", borderColor: "#fecaca", padding: "6px 10px" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPOSE MODAL (ALIGNED TO SIMULCAST CMS-MODAL STANDARD) */}
      {showCompose && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true">
          <div className="cms-modal-scrim" onClick={() => setShowCompose(false)} />
          <div className="cms-modal" style={{ maxWidth: 720 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">WEBMAIL DISPATCH</div>
                <h2>New Message</h2>
              </div>
              <button aria-label="Close" onClick={() => setShowCompose(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cms-fields">
              <div className="cms-field">
                <label>From Mailbox</label>
                <select className="admin-input" value={composeFrom} onChange={(e) => setComposeFrom(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.email}>
                      {a.name} &lt;{a.email}&gt;
                    </option>
                  ))}
                </select>
              </div>

              <div className="cms-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ margin: 0 }}>To Recipient(s)</label>
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      style={{ background: "none", border: "none", color: "#e11d72", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      + CC / BCC
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="recipient@example.com (comma separated for multiple)"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
              </div>

              {showCc && (
                <>
                  <div className="cms-field">
                    <label>Cc</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="cc@example.com"
                      value={composeCc}
                      onChange={(e) => setComposeCc(e.target.value)}
                    />
                  </div>
                  <div className="cms-field">
                    <label>Bcc</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="bcc@example.com"
                      value={composeBcc}
                      onChange={(e) => setComposeBcc(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="cms-field">
                <label>Subject</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Enter email subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>

              <div className="cms-field">
                <label>Message Body (Formatted HTML or text)</label>
                <textarea
                  className="admin-input"
                  rows={9}
                  placeholder="Write message here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                />
              </div>

              {/* Attachments preview */}
              {composeAttachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {composeAttachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="admin-pill"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#faf8fb" }}
                    >
                      <Paperclip size={12} color="#e11d72" />
                      <span>{att.filename}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="cms-modal-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline">
                  <Paperclip size={14} /> Attach Files
                </button>
                <button type="button" onClick={handleSaveDraft} className="btn btn-sm btn-outline" disabled={sending}>
                  Save Draft
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setShowCompose(false)} className="btn btn-sm btn-outline">
                  Cancel
                </button>
                <button type="button" onClick={handleSendWebmail} className="btn btn-sm btn-pink" disabled={sending}>
                  <Send size={14} /> {sending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT CONFIGURATION MODAL */}
      {showAccountModal && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true">
          <div className="cms-modal-scrim" onClick={() => setShowAccountModal(false)} />
          <div className="cms-modal" style={{ maxWidth: 680 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">MAIL SERVER CONFIGURATION</div>
                <h2>{editingAccount ? `Edit ${accountFormData.email}` : "Add Email Account"}</h2>
              </div>
              <button aria-label="Close" onClick={() => setShowAccountModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cms-fields">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="cms-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Simulcast Support NOC"
                    value={accountFormData.name}
                    onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="admin-input"
                    placeholder="support@simulcast.com.np"
                    value={accountFormData.email}
                    onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* INCOMING SERVER */}
              <div style={{ background: "#faf8fb", padding: 14, borderRadius: 8, border: "1px solid #e8e2ec" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2b0d3a", marginBottom: 8 }}>
                  Incoming Server (IMAP / POP3)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Host (e.g. mail.simulcast.com.np)"
                    value={accountFormData.incomingHost}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingHost: e.target.value })}
                  />
                  <input
                    type="number"
                    className="admin-input"
                    placeholder="Port (993)"
                    value={accountFormData.incomingPort}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingPort: parseInt(e.target.value, 10) || 993 })}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2b0d3a" }}>
                    <input
                      type="checkbox"
                      checked={accountFormData.incomingSecure}
                      onChange={(e) => setAccountFormData({ ...accountFormData, incomingSecure: e.target.checked })}
                    />
                    SSL/TLS
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Username"
                    value={accountFormData.incomingUser}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingUser: e.target.value })}
                  />
                  <input
                    type="password"
                    className="admin-input"
                    placeholder="Password"
                    value={accountFormData.incomingPass}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingPass: e.target.value })}
                  />
                </div>
              </div>

              {/* OUTGOING SERVER */}
              <div style={{ background: "#faf8fb", padding: 14, borderRadius: 8, border: "1px solid #e8e2ec" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2b0d3a", marginBottom: 8 }}>
                  Outgoing Server (SMTP)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Host (e.g. mail.simulcast.com.np)"
                    value={accountFormData.outgoingHost}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingHost: e.target.value })}
                  />
                  <input
                    type="number"
                    className="admin-input"
                    placeholder="Port (587)"
                    value={accountFormData.outgoingPort}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingPort: parseInt(e.target.value, 10) || 587 })}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2b0d3a" }}>
                    <input
                      type="checkbox"
                      checked={accountFormData.outgoingSecure}
                      onChange={(e) => setAccountFormData({ ...accountFormData, outgoingSecure: e.target.checked })}
                    />
                    SSL/TLS
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="SMTP Username"
                    value={accountFormData.outgoingUser}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingUser: e.target.value })}
                  />
                  <input
                    type="password"
                    className="admin-input"
                    placeholder="SMTP Password"
                    value={accountFormData.outgoingPass}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingPass: e.target.value })}
                  />
                </div>
              </div>

              {/* Signature */}
              <div className="cms-field">
                <label>Signature (HTML or text)</label>
                <textarea
                  className="admin-input"
                  rows={3}
                  value={accountFormData.signature}
                  onChange={(e) => setAccountFormData({ ...accountFormData, signature: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#2b0d3a" }}>
                  <input
                    type="checkbox"
                    checked={accountFormData.isDefault}
                    onChange={(e) => setAccountFormData({ ...accountFormData, isDefault: e.target.checked })}
                  />
                  Set as Primary / Default Account
                </label>
              </div>
            </div>

            <div className="cms-modal-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleTestAccountConnection}
                className="btn btn-sm btn-outline"
                disabled={testingConnection}
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setShowAccountModal(false)} className="btn btn-sm btn-outline">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveAccount} className="btn btn-sm btn-pink">
                  Save Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
