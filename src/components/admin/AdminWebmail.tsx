"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Shield,
  Clock,
  ChevronDown,
  CornerUpLeft,
  CornerUpRight,
  Download,
  Check,
  Filter,
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
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    smtpStatus: string;
    imapStatus: string;
    smtpMessage: string;
    imapMessage: string;
  } | null>(null);

  // Notification notices
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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
      // Ignore
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
        setMessages(data.messages || []);
        if (data.counts) setCounts(data.counts);

        // If previously selected message is in list, update it
        if (selectedMessage) {
          const updated = (data.messages || []).find((m: WebmailMessage) => m.id === selectedMessage.id);
          if (updated) setSelectedMessage(updated);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSyncMailbox() {
    setSyncing(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/webmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountEmail: selectedAccountEmail === "ALL" ? undefined : selectedAccountEmail }),
      });
      const data = await res.json();
      setNotice(data.message || "Mailbox synchronized successfully.");
      await loadMessages();
      await loadAccounts();
    } catch {
      setErrorNotice("Failed to sync mailbox.");
    } finally {
      setSyncing(false);
      setTimeout(() => setNotice(null), 5000);
    }
  }

  async function handleSelectMessage(msg: WebmailMessage) {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      // Mark as read locally and in API
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
  }

  async function handleDeleteMessage(msg: WebmailMessage) {
    if (!confirm(msg.folder === "TRASH" ? "Permanently delete this email?" : "Move this email to trash?")) return;
    const permanent = msg.folder === "TRASH";
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    if (selectedMessage?.id === msg.id) setSelectedMessage(null);

    await fetch(`/api/admin/webmail/messages/${msg.id}?permanent=${permanent}`, {
      method: "DELETE",
    });
    setNotice(permanent ? "Email deleted permanently." : "Email moved to Trash.");
    loadMessages();
    setTimeout(() => setNotice(null), 4000);
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
      alert("Please specify a recipient email address.");
      return;
    }
    if (!composeSubject.trim()) {
      alert("Please specify a subject.");
      return;
    }

    setSending(true);
    setErrorNotice(null);
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
        setNotice(`Email dispatched successfully from ${composeFrom} to ${composeTo}.`);
        setShowCompose(false);
        loadMessages();
      } else {
        setErrorNotice(`Delivery Notice: ${data.error || "Failed to dispatch email"}. Recorded in Failed folder.`);
        setShowCompose(false);
        loadMessages();
      }
    } catch {
      setErrorNotice("Network error occurred while attempting to dispatch email.");
    } finally {
      setSending(false);
      setTimeout(() => {
        setNotice(null);
        setErrorNotice(null);
      }, 6000);
    }
  }

  async function handleSaveDraft() {
    setSending(true);
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
        setNotice("Draft saved successfully.");
        loadMessages();
      }
    } catch {
      setErrorNotice("Failed to save draft.");
    } finally {
      setSending(false);
      setTimeout(() => setNotice(null), 3000);
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
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveAttachment(idx: number) {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  // Account management actions
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
    setTestResult(null);
    setShowAccountModal(true);
  }

  function handleOpenEditAccount(acc: MailAccount) {
    setEditingAccount(acc);
    setAccountFormData({ ...acc });
    setTestResult(null);
    setShowAccountModal(true);
  }

  async function handleTestAccountConnection() {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/webmail/accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountFormData),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({
        ok: false,
        smtpStatus: "FAILED",
        imapStatus: "FAILED",
        smtpMessage: "Network request failed to verify server.",
        imapMessage: "Network request failed.",
      });
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleSaveAccount() {
    if (!accountFormData.email || !accountFormData.name) {
      alert("Please fill in Account Name and Email Address.");
      return;
    }

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
        setNotice(`Account ${accountFormData.email} saved successfully.`);
        setShowAccountModal(false);
        loadAccounts();
      } else {
        setErrorNotice(data.error || "Failed to save account.");
      }
    } catch {
      setErrorNotice("Network error while saving account.");
    } finally {
      setTimeout(() => {
        setNotice(null);
        setErrorNotice(null);
      }, 4000);
    }
  }

  async function handleDeleteAccount(acc: MailAccount) {
    if (!confirm(`Are you sure you want to delete account ${acc.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/webmail/accounts?id=${acc.id}`, { method: "DELETE" });
      if (res.ok) {
        setNotice(`Account ${acc.email} deleted.`);
        loadAccounts();
      }
    } catch {
      setErrorNotice("Failed to delete account.");
    }
  }

  // Active account metadata
  const currentAccountObj = accounts.find((a) => a.email.toLowerCase() === selectedAccountEmail.toLowerCase());

  return (
    <div className="webmail-suite">
      <style jsx>{`
        .webmail-suite {
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: #f1ecf5;
        }

        .webmail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #17101f;
          border: 1px solid #2e2238;
          border-radius: 12px;
          padding: 14px 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .header-title-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #e11d72, #2b0d3a);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .header-tabs {
          display: flex;
          background: #22182d;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #38274a;
          gap: 4px;
        }

        .header-tab-btn {
          background: transparent;
          border: none;
          color: #a89bb3;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .header-tab-btn.active {
          background: #e11d72;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(225, 29, 114, 0.4);
        }

        .webmail-main-layout {
          display: grid;
          grid-template-columns: 240px 380px 1fr;
          gap: 14px;
          min-height: 720px;
          background: #120c1a;
          border: 1px solid #281d33;
          border-radius: 12px;
          overflow: hidden;
        }

        /* LEFT SIDEBAR: FOLDERS & ACCOUNTS */
        .webmail-sidebar {
          background: #17101f;
          border-right: 1px solid #281d33;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .account-selector-box {
          position: relative;
        }

        .account-select {
          width: 100%;
          background: #23182f;
          border: 1px solid #3c2950;
          color: #ffffff;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .compose-btn {
          width: 100%;
          background: linear-gradient(135deg, #e11d72, #a11453);
          border: none;
          color: #ffffff;
          padding: 11px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(225, 29, 114, 0.35);
          transition: all 0.2s;
        }

        .compose-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(225, 29, 114, 0.5);
        }

        .folder-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .folder-btn {
          background: transparent;
          border: none;
          color: #b7a8c4;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
        }

        .folder-btn-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .folder-btn:hover {
          background: #23182f;
          color: #ffffff;
        }

        .folder-btn.active {
          background: #2c1a3b;
          color: #ff5e9a;
          font-weight: 700;
          border-left: 3px solid #e11d72;
        }

        .badge-count {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 10px;
          background: #2e203c;
          color: #a89ab5;
          font-weight: 600;
        }

        .badge-count.unread {
          background: #e11d72;
          color: #ffffff;
        }

        .badge-count.failed {
          background: #ef4444;
          color: #ffffff;
        }

        .sidebar-section-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #7d6b8c;
          font-weight: 700;
          padding: 0 8px;
          margin-bottom: 6px;
        }

        .filter-nav {
          display: flex;
          gap: 4px;
          background: #21162c;
          padding: 3px;
          border-radius: 6px;
        }

        .filter-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #9c8ca8;
          padding: 5px 0;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
        }

        .filter-btn.active {
          background: #39244d;
          color: #ffffff;
        }

        /* MIDDLE: EMAIL LIST */
        .webmail-list-panel {
          background: #140e1c;
          border-right: 1px solid #281d33;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .list-search-bar {
          padding: 12px;
          border-bottom: 1px solid #281d33;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .search-input-box {
          position: relative;
          flex: 1;
        }

        .search-input {
          width: 100%;
          background: #1d1427;
          border: 1px solid #342444;
          border-radius: 6px;
          padding: 7px 10px 7px 30px;
          font-size: 12px;
          color: #ffffff;
          outline: none;
        }

        .search-icon-pos {
          position: absolute;
          left: 9px;
          top: 8px;
          color: #7b6a8a;
        }

        .refresh-btn {
          background: #21162c;
          border: 1px solid #362447;
          color: #baa9c8;
          padding: 7px 10px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .refresh-btn:hover {
          color: #ffffff;
          border-color: #e11d72;
        }

        .messages-scroll-area {
          flex: 1;
          overflow-y: auto;
        }

        .message-row {
          padding: 12px 14px;
          border-bottom: 1px solid #201729;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          position: relative;
        }

        .message-row:hover {
          background: #1c1326;
        }

        .message-row.active {
          background: #261933;
          border-left: 3px solid #e11d72;
        }

        .message-row.unread {
          background: #181121;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e11d72;
          box-shadow: 0 0 8px #e11d72;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .account-badge-pill {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
          color: #fff;
          background: #39244d;
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .sender-name {
          font-size: 13px;
          font-weight: 500;
          color: #e6dfec;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }

        .message-row.unread .sender-name {
          font-weight: 700;
          color: #ffffff;
        }

        .row-date {
          font-size: 11px;
          color: #8b7999;
          flex-shrink: 0;
        }

        .row-subject {
          font-size: 12px;
          color: #bfaecb;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .message-row.unread .row-subject {
          font-weight: 700;
          color: #ffffff;
        }

        .row-snippet {
          font-size: 11px;
          color: #796887;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* RIGHT: READING PANE */
        .webmail-reader-panel {
          background: #120c1a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .reader-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #6d5b7c;
          gap: 12px;
          text-align: center;
          padding: 40px;
        }

        .reader-toolbar {
          padding: 12px 18px;
          border-bottom: 1px solid #281d33;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #17101f;
        }

        .tool-actions-left {
          display: flex;
          gap: 8px;
        }

        .tool-btn {
          background: #23182f;
          border: 1px solid #3a284c;
          color: #c7b8d4;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tool-btn:hover {
          background: #312142;
          color: #ffffff;
          border-color: #e11d72;
        }

        .tool-btn.danger:hover {
          background: #7f1d1d;
          border-color: #ef4444;
          color: #ffffff;
        }

        .reader-content-scroll {
          flex: 1;
          padding: 22px;
          overflow-y: auto;
        }

        .email-subject-headline {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .email-meta-card {
          background: #191122;
          border: 1px solid #2d203b;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .meta-sender-details {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e11d72, #39144d);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
        }

        .sender-address {
          font-size: 13px;
          color: #baa9c8;
        }

        .recipient-line {
          font-size: 12px;
          color: #7e6c8e;
          margin-top: 2px;
        }

        .email-body-container {
          background: #17101f;
          border: 1px solid #291e35;
          border-radius: 8px;
          padding: 20px;
          color: #ddd4e4;
          font-size: 14px;
          line-height: 1.6;
        }

        .attachments-preview-section {
          margin-top: 20px;
          padding: 14px;
          background: #181121;
          border: 1px solid #2e213b;
          border-radius: 8px;
        }

        .attachments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .attachment-card {
          background: #22182d;
          border: 1px solid #37264a;
          border-radius: 6px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        /* COMPOSE MODAL */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 4, 12, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .compose-modal {
          background: #181022;
          border: 1px solid #3a284c;
          border-radius: 12px;
          width: 100%;
          max-width: 760px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          max-height: 90vh;
        }

        .compose-header {
          padding: 14px 18px;
          background: #20152c;
          border-bottom: 1px solid #332344;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 15px;
          color: #ffffff;
        }

        .compose-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
        }

        .input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #281d33;
          padding-bottom: 8px;
        }

        .input-label {
          width: 50px;
          font-size: 12px;
          font-weight: 700;
          color: #9c8ca8;
        }

        .compose-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 13px;
          outline: none;
        }

        .compose-textarea {
          width: 100%;
          min-height: 220px;
          background: #130d1b;
          border: 1px solid #2f203e;
          border-radius: 8px;
          padding: 12px;
          color: #f1ecf5;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          line-height: 1.5;
        }

        .compose-footer {
          padding: 12px 18px;
          background: #1c1326;
          border-top: 1px solid #302140;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ACCOUNTS VIEW */
        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
        }

        .account-card-box {
          background: #17101f;
          border: 1px solid #2e2238;
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.2s;
        }

        .account-card-box:hover {
          border-color: #e11d72;
        }

        .account-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .account-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }

        .account-card-email {
          font-size: 13px;
          color: #ff68a2;
          font-weight: 600;
        }

        .account-meta-specs {
          background: #1f1629;
          border: 1px solid #302140;
          border-radius: 6px;
          padding: 10px;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #a494b2;
        }

        .account-card-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        .notice-banner {
          background: #1e1127;
          border-left: 4px solid #10b981;
          color: #a7f3d0;
          padding: 10px 16px;
          border-radius: 0 8px 8px 0;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notice-banner.error {
          border-left-color: #ef4444;
          color: #fecaca;
        }
      `}</style>

      {/* TOP HEADER BAR */}
      <div className="webmail-header">
        <div className="header-title-box">
          <div className="header-icon">
            <Mail size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
              Simulcast Webmail Suite
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#a596b1" }}>
              Multi-account enterprise webmail, IMAP/SMTP routing &amp; automated MCP dispatch
            </p>
          </div>
        </div>

        <div className="header-tabs">
          <button
            className={`header-tab-btn ${subView === "webmail" ? "active" : ""}`}
            onClick={() => setSubView("webmail")}
          >
            <Inbox size={15} /> Webmail Client
          </button>
          <button
            className={`header-tab-btn ${subView === "accounts" ? "active" : ""}`}
            onClick={() => setSubView("accounts")}
          >
            <Server size={15} /> Mail Accounts ({accounts.length})
          </button>
        </div>
      </div>

      {notice && (
        <div className="notice-banner">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}
      {errorNotice && (
        <div className="notice-banner error">
          <AlertTriangle size={16} /> {errorNotice}
        </div>
      )}

      {/* VIEW 1: FULL WEBMAIL CLIENT */}
      {subView === "webmail" && (
        <div className="webmail-main-layout">
          {/* COLUMN 1: SIDEBAR */}
          <div className="webmail-sidebar">
            <button className="compose-btn" onClick={() => handleOpenCompose()}>
              <FileEdit size={16} /> Compose Email
            </button>

            {/* Account Switcher */}
            <div className="account-selector-box">
              <div className="sidebar-section-title">ACTIVE MAILBOX</div>
              <select
                className="account-select"
                value={selectedAccountEmail}
                onChange={(e) => {
                  setSelectedAccountEmail(e.target.value);
                  setSelectedMessage(null);
                }}
              >
                <option value="ALL">All Inboxes (Unified View)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.email} ({acc.name.split(" ")[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Folder Navigation */}
            <div>
              <div className="sidebar-section-title">FOLDERS</div>
              <div className="folder-nav">
                <button
                  className={`folder-btn ${activeFolder === "INBOX" ? "active" : ""}`}
                  onClick={() => {
                    setActiveFolder("INBOX");
                    setSelectedMessage(null);
                  }}
                >
                  <span className="folder-btn-left">
                    <Inbox size={16} /> Inbox
                  </span>
                  {counts.inboxUnread > 0 ? (
                    <span className="badge-count unread">{counts.inboxUnread}</span>
                  ) : (
                    <span className="badge-count">{counts.inboxTotal}</span>
                  )}
                </button>

                <button
                  className={`folder-btn ${activeFolder === "SENT" ? "active" : ""}`}
                  onClick={() => {
                    setActiveFolder("SENT");
                    setSelectedMessage(null);
                  }}
                >
                  <span className="folder-btn-left">
                    <Send size={16} /> Sent
                  </span>
                  <span className="badge-count">{counts.sentTotal}</span>
                </button>

                <button
                  className={`folder-btn ${activeFolder === "DRAFTS" ? "active" : ""}`}
                  onClick={() => {
                    setActiveFolder("DRAFTS");
                    setSelectedMessage(null);
                  }}
                >
                  <span className="folder-btn-left">
                    <FileEdit size={16} /> Drafts
                  </span>
                  <span className="badge-count">{counts.draftsTotal}</span>
                </button>

                <button
                  className={`folder-btn ${activeFolder === "FAILED" ? "active" : ""}`}
                  onClick={() => {
                    setActiveFolder("FAILED");
                    setSelectedMessage(null);
                  }}
                >
                  <span className="folder-btn-left">
                    <AlertTriangle size={16} color="#ef4444" /> Failed
                  </span>
                  {counts.failedTotal > 0 ? (
                    <span className="badge-count failed">{counts.failedTotal}</span>
                  ) : (
                    <span className="badge-count">0</span>
                  )}
                </button>

                <button
                  className={`folder-btn ${activeFolder === "STARRED" ? "active" : ""}`}
                  onClick={() => {
                    setActiveFolder("STARRED");
                    setSelectedMessage(null);
                  }}
                >
                  <span className="folder-btn-left">
                    <Star size={16} color="#f59e0b" /> Starred
                  </span>
                  <span className="badge-count">{counts.starredTotal}</span>
                </button>

                <button
                  className={`folder-btn ${activeFolder === "TRASH" ? "active" : ""}`}
                  onClick={() => {
                    setActiveFolder("TRASH");
                    setSelectedMessage(null);
                  }}
                >
                  <span className="folder-btn-left">
                    <Trash2 size={16} /> Trash
                  </span>
                  <span className="badge-count">{counts.trashTotal}</span>
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <div className="sidebar-section-title">STATUS FILTER</div>
              <div className="filter-nav">
                <button
                  className={`filter-btn ${filterMode === "ALL" ? "active" : ""}`}
                  onClick={() => setFilterMode("ALL")}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterMode === "UNREAD" ? "active" : ""}`}
                  onClick={() => setFilterMode("UNREAD")}
                >
                  Unread
                </button>
                <button
                  className={`filter-btn ${filterMode === "READ" ? "active" : ""}`}
                  onClick={() => setFilterMode("READ")}
                >
                  Read
                </button>
              </div>
            </div>

            {/* Sync trigger */}
            <div style={{ marginTop: "auto" }}>
              <button
                className="tool-btn"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleSyncMailbox}
                disabled={syncing}
              >
                <RefreshCw size={14} className={syncing ? "spin-icon" : ""} />
                {syncing ? "Syncing Mailbox..." : "Sync Mailbox Now"}
              </button>
            </div>
          </div>

          {/* COLUMN 2: EMAIL LIST */}
          <div className="webmail-list-panel">
            <div className="list-search-bar">
              <div className="search-input-box">
                <Search size={14} className="search-icon-pos" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadMessages()}
                />
              </div>
              <button className="refresh-btn" onClick={() => loadMessages()} title="Refresh message list">
                <RefreshCw size={13} className={loadingMessages ? "spin-icon" : ""} />
              </button>
            </div>

            <div className="messages-scroll-area">
              {loadingMessages ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#8a7799" }}>
                  <RefreshCw size={22} className="spin-icon" style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "13px" }}>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#6f5e7f" }}>
                  <Mail size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>No emails found</p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px" }}>This folder is currently empty.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isUnread = !msg.isRead;
                  const acc = accounts.find((a) => a.email.toLowerCase() === msg.accountEmail.toLowerCase());

                  return (
                    <div
                      key={msg.id}
                      className={`message-row ${isSelected ? "active" : ""} ${isUnread ? "unread" : ""}`}
                      onClick={() => {
                        if (msg.folder === "DRAFTS") {
                          handleOpenDraft(msg);
                        } else {
                          handleSelectMessage(msg);
                        }
                      }}
                    >
                      {isUnread && <div className="unread-dot" />}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="sender-name">
                              {msg.folder === "SENT" || msg.folder === "DRAFTS" ? `To: ${msg.to}` : msg.from}
                            </span>
                            {selectedAccountEmail === "ALL" && (
                              <span
                                className="account-badge-pill"
                                style={{ background: acc?.color || "#39244d" }}
                              >
                                {msg.accountEmail.split("@")[0]}
                              </span>
                            )}
                          </div>
                          <span className="row-date">
                            {new Date(msg.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        <div className="row-subject">
                          {msg.isStarred && <Star size={12} color="#f59e0b" style={{ display: "inline", marginRight: "4px" }} fill="#f59e0b" />}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <Paperclip size={12} style={{ display: "inline", marginRight: "4px", color: "#e11d72" }} />
                          )}
                          {msg.subject || "(No Subject)"}
                        </div>

                        <div className="row-snippet">{msg.snippet || "(No preview text)"}</div>
                      </div>

                      <button
                        style={{ background: "none", border: "none", color: msg.isStarred ? "#f59e0b" : "#4a3c57", cursor: "pointer", padding: "2px" }}
                        onClick={(e) => handleToggleStar(msg, e)}
                        title={msg.isStarred ? "Unstar" : "Star email"}
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
          <div className="webmail-reader-panel">
            {!selectedMessage ? (
              <div className="reader-empty-state">
                <Mail size={48} style={{ opacity: 0.3 }} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#8d799d" }}>Select an email to view</h3>
                <p style={{ margin: 0, fontSize: "12px", maxWidth: "260px", lineHeight: "1.5" }}>
                  Choose a conversation from the list to view its complete headers, attachments, and formatted message body.
                </p>
              </div>
            ) : (
              <>
                {/* TOOLBAR */}
                <div className="reader-toolbar">
                  <div className="tool-actions-left">
                    <button className="tool-btn" onClick={() => handleOpenCompose(selectedMessage, false)}>
                      <CornerUpLeft size={14} /> Reply
                    </button>
                    <button className="tool-btn" onClick={() => handleOpenCompose(selectedMessage, true)}>
                      <CornerUpRight size={14} /> Forward
                    </button>
                    <button className="tool-btn" onClick={() => handleToggleRead(selectedMessage)}>
                      <Eye size={14} /> {selectedMessage.isRead ? "Mark as Unread" : "Mark as Read"}
                    </button>
                    <button className="tool-btn" onClick={(e) => handleToggleStar(selectedMessage, e)}>
                      <Star size={14} fill={selectedMessage.isStarred ? "#f59e0b" : "none"} color={selectedMessage.isStarred ? "#f59e0b" : "currentColor"} />
                      {selectedMessage.isStarred ? "Starred" : "Star"}
                    </button>
                  </div>

                  <div>
                    <button className="tool-btn danger" onClick={() => handleDeleteMessage(selectedMessage)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="reader-content-scroll">
                  <div className="email-subject-headline">
                    <span>{selectedMessage.subject || "(No Subject)"}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#2b1c38",
                        color: "#ff68a2",
                        fontWeight: 600,
                      }}
                    >
                      {selectedMessage.folder}
                    </span>
                  </div>

                  <div className="email-meta-card">
                    <div className="meta-sender-details">
                      <div className="avatar-circle">
                        {(selectedMessage.from[0] || "S").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                          {selectedMessage.from}
                        </div>
                        <div className="recipient-line">
                          <strong>To:</strong> {selectedMessage.to}
                          {selectedMessage.cc && ` | CC: ${selectedMessage.cc}`}
                        </div>
                        <div className="recipient-line">
                          <strong>Mailbox:</strong> {selectedMessage.accountEmail}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", fontSize: "12px", color: "#8a7999" }}>
                      <div>{new Date(selectedMessage.date).toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</div>
                      <div style={{ marginTop: "2px" }}>{new Date(selectedMessage.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>

                  {/* BODY */}
                  <div
                    className="email-body-container"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml || selectedMessage.bodyText || "" }}
                  />

                  {/* ATTACHMENTS */}
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="attachments-preview-section">
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#c1b0ce", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Paperclip size={14} color="#e11d72" />
                        Attachments ({selectedMessage.attachments.length})
                      </div>
                      <div className="attachments-grid">
                        {selectedMessage.attachments.map((att, i) => (
                          <div key={i} className="attachment-card">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                              <Paperclip size={14} color="#a493b2" />
                              <span style={{ fontSize: "12px", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {att.filename}
                              </span>
                            </div>
                            {att.size && (
                              <span style={{ fontSize: "11px", color: "#827091" }}>
                                {Math.round(att.size / 1024)} KB
                              </span>
                            )}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff", fontWeight: 700 }}>
                Configured Email Accounts &amp; Mail Servers
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9c8ba8" }}>
                Add and manage multiple business accounts (e.g. support, info, sales, kalyan). Each account supports dedicated SMTP and IMAP settings.
              </p>
            </div>
            <button className="compose-btn" style={{ width: "auto", padding: "8px 16px" }} onClick={handleOpenAddAccount}>
              <Plus size={16} /> Add Email Account
            </button>
          </div>

          <div className="accounts-grid">
            {accounts.map((acc) => (
              <div key={acc.id} className="account-card-box">
                <div className="account-card-header">
                  <div>
                    <div className="account-card-title">{acc.name}</div>
                    <div className="account-card-email">{acc.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {acc.isDefault && (
                      <span style={{ fontSize: "10px", background: "#e11d72", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        PRIMARY
                      </span>
                    )}
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: acc.color || "#e11d72",
                        display: "inline-block",
                      }}
                    />
                  </div>
                </div>

                <div className="account-meta-specs">
                  <div>
                    <strong>Incoming ({acc.incomingType}):</strong> {acc.incomingHost}:{acc.incomingPort} (SSL: {acc.incomingSecure ? "Yes" : "No"})
                  </div>
                  <div>
                    <strong>Outgoing (SMTP):</strong> {acc.outgoingHost}:{acc.outgoingPort} (SSL: {acc.outgoingSecure ? "Yes" : "No"})
                  </div>
                  <div>
                    <strong>Sync Interval:</strong> Every {acc.syncInterval} minutes | Last sync:{" "}
                    {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleTimeString() : "Never"}
                  </div>
                </div>

                <div className="account-card-actions">
                  <button className="tool-btn" onClick={() => handleOpenEditAccount(acc)}>
                    <Settings size={13} /> Edit / Credentials
                  </button>
                  <button
                    className="tool-btn"
                    onClick={async () => {
                      setNotice(`Testing connection for ${acc.email}...`);
                      const res = await fetch("/api/admin/webmail/accounts/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(acc),
                      });
                      const data = await res.json();
                      alert(`[${acc.email} Test Diagnostic]\nSMTP: ${data.smtpStatus} - ${data.smtpMessage}\nIMAP: ${data.imapStatus} - ${data.imapMessage}`);
                    }}
                  >
                    <CheckCircle2 size={13} /> Test Connection
                  </button>
                  <button className="tool-btn danger" onClick={() => handleDeleteAccount(acc)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPOSE MODAL */}
      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="compose-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compose-header">
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={16} color="#e11d72" /> New Message
              </span>
              <button
                style={{ background: "none", border: "none", color: "#a89bb3", cursor: "pointer" }}
                onClick={() => setShowCompose(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="compose-body">
              {/* From selector */}
              <div className="input-row">
                <span className="input-label">From:</span>
                <select
                  className="account-select"
                  style={{ width: "auto", flex: 1 }}
                  value={composeFrom}
                  onChange={(e) => setComposeFrom(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.email}>
                      {a.name} &lt;{a.email}&gt;
                    </option>
                  ))}
                </select>
              </div>

              {/* To */}
              <div className="input-row">
                <span className="input-label">To:</span>
                <input
                  type="text"
                  placeholder="recipient@example.com (comma separated for multiple)"
                  className="compose-input"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
                {!showCc && (
                  <button
                    style={{ background: "none", border: "none", color: "#e11d72", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                    onClick={() => setShowCc(true)}
                  >
                    + CC / BCC
                  </button>
                )}
              </div>

              {/* CC / BCC */}
              {showCc && (
                <>
                  <div className="input-row">
                    <span className="input-label">Cc:</span>
                    <input
                      type="text"
                      placeholder="cc@example.com"
                      className="compose-input"
                      value={composeCc}
                      onChange={(e) => setComposeCc(e.target.value)}
                    />
                  </div>
                  <div className="input-row">
                    <span className="input-label">Bcc:</span>
                    <input
                      type="text"
                      placeholder="bcc@example.com"
                      className="compose-input"
                      value={composeBcc}
                      onChange={(e) => setComposeBcc(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Subject */}
              <div className="input-row">
                <span className="input-label">Subject:</span>
                <input
                  type="text"
                  placeholder="Enter email subject"
                  className="compose-input"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>

              {/* Body */}
              <div>
                <textarea
                  className="compose-textarea"
                  placeholder="Write your email message here... (Supports formatted HTML and text)"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                />
              </div>

              {/* Attachments List */}
              {composeAttachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {composeAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#2a1c38",
                        border: "1px solid #432b5b",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                      }}
                    >
                      <Paperclip size={12} color="#e11d72" />
                      <span>{att.filename}</span>
                      {att.size && <span style={{ color: "#8a7a97", fontSize: "10px" }}>({Math.round(att.size / 1024)} KB)</span>}
                      <button
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 }}
                        onClick={() => handleRemoveAttachment(idx)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="compose-footer">
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                <button
                  className="tool-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                >
                  <Paperclip size={14} /> Attach Files
                </button>
                <button className="tool-btn" onClick={handleSaveDraft} disabled={sending}>
                  Save Draft
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className="tool-btn"
                  onClick={() => setShowCompose(false)}
                >
                  Discard
                </button>
                <button
                  className="compose-btn"
                  style={{ width: "auto", padding: "8px 20px" }}
                  onClick={handleSendWebmail}
                  disabled={sending}
                >
                  <Send size={15} /> {sending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT CONFIGURATION MODAL */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="compose-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="compose-header">
              <span>{editingAccount ? `Edit Account: ${accountFormData.email}` : "Add New Mail Account"}</span>
              <button
                style={{ background: "none", border: "none", color: "#a89bb3", cursor: "pointer" }}
                onClick={() => setShowAccountModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="compose-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#baa9c8", display: "block", marginBottom: "4px" }}>
                    Account Display Name
                  </label>
                  <input
                    type="text"
                    className="compose-input"
                    style={{ background: "#221730", padding: "8px 10px", borderRadius: "6px", width: "100%" }}
                    placeholder="e.g. Simulcast Support NOC"
                    value={accountFormData.name}
                    onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#baa9c8", display: "block", marginBottom: "4px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="compose-input"
                    style={{ background: "#221730", padding: "8px 10px", borderRadius: "6px", width: "100%" }}
                    placeholder="support@simulcast.com.np"
                    value={accountFormData.email}
                    onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* INCOMING SERVER */}
              <div style={{ background: "#1c1326", padding: "12px", borderRadius: "8px", border: "1px solid #332345" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ff68a2", marginBottom: "8px" }}>
                  Incoming Mail Server (IMAP / POP3)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="Host (e.g. mail.simulcast.com.np)"
                    value={accountFormData.incomingHost}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingHost: e.target.value })}
                  />
                  <input
                    type="number"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="Port (993)"
                    value={accountFormData.incomingPort}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingPort: parseInt(e.target.value, 10) || 993 })}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#ccc" }}>
                    <input
                      type="checkbox"
                      checked={accountFormData.incomingSecure}
                      onChange={(e) => setAccountFormData({ ...accountFormData, incomingSecure: e.target.checked })}
                    />
                    SSL/TLS
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                  <input
                    type="text"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="Username (e.g. support@simulcast.com.np)"
                    value={accountFormData.incomingUser}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingUser: e.target.value })}
                  />
                  <input
                    type="password"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="Password"
                    value={accountFormData.incomingPass}
                    onChange={(e) => setAccountFormData({ ...accountFormData, incomingPass: e.target.value })}
                  />
                </div>
              </div>

              {/* OUTGOING SERVER */}
              <div style={{ background: "#1c1326", padding: "12px", borderRadius: "8px", border: "1px solid #332345" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#10b981", marginBottom: "8px" }}>
                  Outgoing Mail Server (SMTP)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="SMTP Host (e.g. mail.simulcast.com.np)"
                    value={accountFormData.outgoingHost}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingHost: e.target.value })}
                  />
                  <input
                    type="number"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="Port (587 or 465)"
                    value={accountFormData.outgoingPort}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingPort: parseInt(e.target.value, 10) || 587 })}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#ccc" }}>
                    <input
                      type="checkbox"
                      checked={accountFormData.outgoingSecure}
                      onChange={(e) => setAccountFormData({ ...accountFormData, outgoingSecure: e.target.checked })}
                    />
                    SSL/TLS
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                  <input
                    type="text"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="SMTP Username"
                    value={accountFormData.outgoingUser}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingUser: e.target.value })}
                  />
                  <input
                    type="password"
                    className="compose-input"
                    style={{ background: "#221730", padding: "7px 10px", borderRadius: "6px" }}
                    placeholder="SMTP Password"
                    value={accountFormData.outgoingPass}
                    onChange={(e) => setAccountFormData({ ...accountFormData, outgoingPass: e.target.value })}
                  />
                </div>
              </div>

              {/* SIGNATURE & PREFERENCES */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#baa9c8", display: "block", marginBottom: "4px" }}>
                  Email Signature (HTML or Text)
                </label>
                <textarea
                  className="compose-input"
                  style={{ width: "100%", height: "70px", background: "#221730", padding: "8px 10px", borderRadius: "6px" }}
                  placeholder="<p>24/7 Support Desk | Simulcast Technologies</p>"
                  value={accountFormData.signature}
                  onChange={(e) => setAccountFormData({ ...accountFormData, signature: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#ffffff" }}>
                  <input
                    type="checkbox"
                    checked={accountFormData.isDefault}
                    onChange={(e) => setAccountFormData({ ...accountFormData, isDefault: e.target.checked })}
                  />
                  Set as Primary / Default Account
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#baa9c8" }}>Badge Color:</span>
                  <input
                    type="color"
                    value={accountFormData.color || "#e11d72"}
                    onChange={(e) => setAccountFormData({ ...accountFormData, color: e.target.value })}
                    style={{ background: "none", border: "none", cursor: "pointer", width: "28px", height: "28px" }}
                  />
                </div>
              </div>

              {/* TEST RESULT DIAGNOSTICS */}
              {testResult && (
                <div
                  style={{
                    background: testResult.ok ? "#064e3b" : "#7f1d1d",
                    border: `1px solid ${testResult.ok ? "#10b981" : "#ef4444"}`,
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#ffffff",
                  }}
                >
                  <div><strong>SMTP:</strong> {testResult.smtpStatus} - {testResult.smtpMessage}</div>
                  <div style={{ marginTop: "4px" }}><strong>IMAP:</strong> {testResult.imapStatus} - {testResult.imapMessage}</div>
                </div>
              )}
            </div>

            <div className="compose-footer">
              <button
                className="tool-btn"
                onClick={handleTestAccountConnection}
                disabled={testingConnection}
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button className="tool-btn" onClick={() => setShowAccountModal(false)}>
                  Cancel
                </button>
                <button className="compose-btn" style={{ width: "auto", padding: "8px 18px" }} onClick={handleSaveAccount}>
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
