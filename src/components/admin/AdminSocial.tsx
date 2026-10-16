"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Linkedin,
  Facebook,
  Instagram,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Plus,
  Image as ImageIcon,
  Key,
  ShieldCheck,
  Settings,
  X,
  Radio,
  Layers,
  Sparkles,
  Heart,
  MessageCircle,
  Repeat2,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

interface SocialAccount {
  id: string;
  platform: "LINKEDIN" | "FACEBOOK" | "INSTAGRAM";
  accountName: string;
  accountType: string;
  targetId: string;
  authorUrn?: string;
  accessToken: string;
  pageUrl?: string;
  category?: string;
  fanCount?: number;
  status: "CONNECTED" | "DISCONNECTED" | "EXPIRED";
  connectedAt: string;
  lastPostAt?: string | null;
}

interface SocialPost {
  id: string;
  content: string;
  mediaUrl?: string;
  author: string;
  platforms: Array<{
    platform: "LINKEDIN" | "FACEBOOK" | "INSTAGRAM";
    status: "PUBLISHED" | "FAILED" | "PENDING";
    postId?: string;
    postUrl?: string;
    error?: string;
  }>;
  status: "PUBLISHED" | "PARTIAL" | "FAILED";
  createdAt: string;
}

interface FacebookPageOption {
  id: string;
  name: string;
  category: string;
  accessToken: string;
  fanCount?: number;
  instagramBusinessAccount?: {
    id: string;
    username: string;
    name?: string;
  };
}

export default function AdminSocial() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Composer State
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Array<"LINKEDIN" | "FACEBOOK" | "INSTAGRAM">>([
    "LINKEDIN",
    "FACEBOOK",
    "INSTAGRAM",
  ]);
  const [previewPlatform, setPreviewPlatform] = useState<"LINKEDIN" | "FACEBOOK" | "INSTAGRAM">("LINKEDIN");

  // Connect Modals
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // LinkedIn Connect Form
  const [liClientId, setLiClientId] = useState("");
  const [liClientSecret, setLiClientSecret] = useState("");
  const [liAccountName, setLiAccountName] = useState("");
  const [liOrgUrn, setLiOrgUrn] = useState("");
  const [liToken, setLiToken] = useState("");
  const [liAccountType, setLiAccountType] = useState<"ORGANIZATION" | "PROFILE">("ORGANIZATION");
  const [liUseOpenId, setLiUseOpenId] = useState(false);

  // Facebook Connect & Page Selection Flow
  const [fbAppId, setFbAppId] = useState("");
  const [fbAppSecret, setFbAppSecret] = useState("");
  const [fbUserToken, setFbUserToken] = useState("");
  const [fbLoadingPages, setFbLoadingPages] = useState(false);
  const [fbDiscoveredPages, setFbDiscoveredPages] = useState<FacebookPageOption[]>([]);
  const [fbStep, setFbStep] = useState<"TOKEN" | "CHOOSE_PAGE">("TOKEN");

  // Visual Media Presets
  const visualPresets = [
    { label: "Master Control Concept", url: "/media/control-room-concept.webp" },
    { label: "Studio Control Wall", url: "/media/studio-control-wall.webp" },
    { label: "Telecom Infrastructure", url: "/media/infrastructure-rack.webp" },
    { label: "Multi-Screen Delivery", url: "/media/multi-screen-delivery.webp" },
    { label: "Simulcast Brand Master", url: "/brand/logo-master.png" },
  ];

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        setPosts(data.posts || []);
        if (data.settings) {
          if (data.settings.linkedinClientId) setLiClientId(data.settings.linkedinClientId);
          if (data.settings.linkedinClientSecret) setLiClientSecret(data.settings.linkedinClientSecret);
          if (data.settings.facebookAppId) setFbAppId(data.settings.facebookAppId);
          if (data.settings.facebookAppSecret) setFbAppSecret(data.settings.facebookAppSecret);
        }
      }
    } catch {
      toast.error("Failed loading social accounts");
    } finally {
      setLoading(false);
    }
  }

  // Prevent background scroll and allow ESC key to close any active modal
  useEffect(() => {
    const isAnyModalOpen = showLinkedInModal || showFacebookModal || showSettingsModal;
    if (typeof document !== "undefined") {
      document.body.style.overflow = isAnyModalOpen ? "hidden" : "";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLinkedInModal(false);
        setShowFacebookModal(false);
        setShowSettingsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [showLinkedInModal, showFacebookModal, showSettingsModal]);

  useEffect(() => {
    loadData();

    // Check URL parameters for OAuth callbacks
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oauthSuccess = params.get("oauth_success");
      const token = params.get("token");
      const error = params.get("error");

      if (error) {
        toast.error(`OAuth error: ${error}`);
      } else if (oauthSuccess === "facebook" && token) {
        setFbUserToken(token);
        setShowFacebookModal(true);
        handleFetchFacebookPages(token);
        toast.success("Meta OAuth authorization successful! Fetching your managed Facebook Pages...");
      } else if (oauthSuccess === "linkedin" && token) {
        setLiToken(token);
        const urlUrn = params.get("urn");
        const urlName = params.get("name");
        if (urlUrn) setLiOrgUrn(urlUrn);
        if (urlName) setLiAccountName(urlName);
        setShowLinkedInModal(true);
        toast.success("LinkedIn OAuth successful! Review details and click Save & Connect Page.");
      }
    }
  }, []);

  function togglePlatform(plat: "LINKEDIN" | "FACEBOOK" | "INSTAGRAM") {
    if (selectedPlatforms.includes(plat)) {
      if (selectedPlatforms.length === 1) {
        toast.error("At least one platform must remain selected.");
        return;
      }
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat));
    } else {
      setSelectedPlatforms([...selectedPlatforms, plat]);
      setPreviewPlatform(plat);
    }
  }

  async function handlePublish() {
    if (!content.trim()) {
      toast.error("Please enter post text content.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one social media platform.");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mediaUrl: mediaUrl.trim() || undefined,
          platforms: selectedPlatforms,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Post dispatched to social platforms!");
        setContent("");
        loadData();
      } else {
        toast.error(data.error || "Failed publishing post");
      }
    } catch {
      toast.error("Network error while publishing post");
    } finally {
      setPosting(false);
    }
  }

  async function handleDisconnect(platform: string) {
    if (!confirm(`Disconnect ${platform}? It will no longer receive automated or admin posts.`)) return;
    try {
      const res = await fetch("/api/admin/social/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        toast.success(`Disconnected ${platform}`);
        loadData();
      } else {
        toast.error("Failed to disconnect platform");
      }
    } catch {
      toast.error("Network error");
    }
  }

  // LinkedIn Connection Handler
  async function handleSaveLinkedIn() {
    const token = liToken.trim();
    if (!token) {
      toast.error("Please paste your LinkedIn Access Token, or sign in via OAuth below.");
      return;
    }
    const orgUrn = liOrgUrn.trim();
    if (!orgUrn) {
      toast.error("Please enter your LinkedIn URN (e.g. urn:li:organization:12345 or urn:li:person:your_profile_id).");
      return;
    }

    try {
      const res = await fetch("/api/admin/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "LINKEDIN",
          accountName: liAccountName.trim() || (liAccountType === "ORGANIZATION" ? "LinkedIn Organization Page" : "LinkedIn Member Profile"),
          accountType: liAccountType,
          targetId: orgUrn.split(":").pop() || orgUrn,
          authorUrn: orgUrn,
          accessToken: token,
          category: liAccountType === "ORGANIZATION" ? "Organization Page" : "Member Profile",
        }),
      });
      if (res.ok) {
        toast.success("LinkedIn account connected successfully!");
        setShowLinkedInModal(false);
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed connecting LinkedIn");
      }
    } catch {
      toast.error("Connection error");
    }
  }

  // Facebook Pages Discovery Handler ("after login success choose page karo aur connect karo")
  async function handleFetchFacebookPages(tokenToUse?: string) {
    const token = (tokenToUse || fbUserToken).trim();
    if (!token) {
      toast.error("Please paste your Meta User Access Token to discover your Facebook Pages.");
      return;
    }

    setFbLoadingPages(true);
    try {
      const res = await fetch("/api/admin/social/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "FACEBOOK", token }),
      });

      if (res.ok) {
        const data = await res.json();
        setFbDiscoveredPages(data.pages || []);
        setFbStep("CHOOSE_PAGE");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to load managed Facebook Pages");
      }
    } catch {
      toast.error("Error fetching Facebook Pages");
    } finally {
      setFbLoadingPages(false);
    }
  }

  // Select and connect chosen Facebook Page
  async function handleConnectChosenPage(page: FacebookPageOption) {
    try {
      const res = await fetch("/api/admin/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "FACEBOOK",
          accountName: page.name,
          accountType: "PAGE",
          targetId: page.id,
          accessToken: page.accessToken,
          category: page.category,
          fanCount: page.fanCount,
          instagramAccount: page.instagramBusinessAccount,
        }),
      });

      if (res.ok) {
        toast.success(`Successfully connected Facebook Page "${page.name}"!`);
        if (page.instagramBusinessAccount) {
          toast.success(`Also linked Instagram @${page.instagramBusinessAccount.username}!`);
        }
        setShowFacebookModal(false);
        setFbStep("TOKEN");
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed connecting page");
      }
    } catch {
      toast.error("Error connecting page");
    }
  }

  const linkedinAcc = accounts.find((a) => a.platform === "LINKEDIN");
  const facebookAcc = accounts.find((a) => a.platform === "FACEBOOK");
  const instagramAcc = accounts.find((a) => a.platform === "INSTAGRAM");

  return (
    <div className="admin-social-hub" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#2b0d3a" }}>Social Media Hub</h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "#fdf2f8",
                color: "#e11d72",
                border: "1px solid #fbcfe8",
                padding: "3px 8px",
                borderRadius: 12,
              }}
            >
              Omnichannel Publisher
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7b6f84" }}>
            Publish updates and product announcements simultaneously to official LinkedIn, Facebook, and Instagram channels.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="btn btn-outline btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Key size={13} /> API Keys & OAuth
          </button>
        </div>
      </div>

      {/* Connected Channel Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
        {/* LinkedIn Card */}
        <div
          style={{
            background: "#ffffff",
            border: `1.5px solid ${linkedinAcc?.status === "CONNECTED" ? "#bfdbfe" : "#eae4eb"}`,
            borderRadius: 10,
            padding: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: "#0a66c2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                  }}
                >
                  <Linkedin size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2b0d3a" }}>LinkedIn Page</div>
                  <div style={{ fontSize: 11, color: "#7b6f84" }}>
                    {liClientId ? `App Client ID: ${liClientId}` : "Official Company Channel"}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: linkedinAcc?.status === "CONNECTED" ? "#ecfdf5" : "#fef2f2",
                  color: linkedinAcc?.status === "CONNECTED" ? "#059669" : "#dc2626",
                  border: `1px solid ${linkedinAcc?.status === "CONNECTED" ? "#a7f3d0" : "#fecaca"}`,
                }}
              >
                {linkedinAcc?.status === "CONNECTED" ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>

            {linkedinAcc?.status === "CONNECTED" ? (
              <div style={{ fontSize: 12, color: "#4a3e52", background: "#f8fafd", padding: "10px 12px", borderRadius: 6, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, color: "#0a66c2" }}>{linkedinAcc.accountName}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  URN: <code>{linkedinAcc.authorUrn || `urn:li:organization:${linkedinAcc.targetId}`}</code>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                  Last Post: {linkedinAcc.lastPostAt ? new Date(linkedinAcc.lastPostAt).toLocaleString() : "Ready to post"}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#7b6f84", margin: "0 0 14px" }}>
                Connect your official LinkedIn Company Page or profile via OAuth 2.0 or Access Token to publish technical announcements.
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1edf3", paddingTop: 12 }}>
            {linkedinAcc?.status === "CONNECTED" ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowLinkedInModal(true)}
                  className="btn btn-outline btn-xs"
                  style={{ flex: 1 }}
                >
                  Configure
                </button>
                <button
                  type="button"
                  onClick={() => handleDisconnect("LINKEDIN")}
                  className="btn btn-outline btn-xs"
                  style={{ color: "#dc2626", borderColor: "#fecaca" }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowLinkedInModal(true)}
                className="btn btn-sm btn-pink"
                style={{ width: "100%", background: "#0a66c2", borderColor: "#0a66c2" }}
              >
                <Plus size={14} /> Connect to LinkedIn
              </button>
            )}
          </div>
        </div>

        {/* Facebook Card */}
        <div
          style={{
            background: "#ffffff",
            border: `1.5px solid ${facebookAcc?.status === "CONNECTED" ? "#bfdbfe" : "#eae4eb"}`,
            borderRadius: 10,
            padding: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: "#1877f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                  }}
                >
                  <Facebook size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2b0d3a" }}>Facebook Page</div>
                  <div style={{ fontSize: 11, color: "#7b6f84" }}>Official Business Page</div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: facebookAcc?.status === "CONNECTED" ? "#ecfdf5" : "#fef2f2",
                  color: facebookAcc?.status === "CONNECTED" ? "#059669" : "#dc2626",
                  border: `1px solid ${facebookAcc?.status === "CONNECTED" ? "#a7f3d0" : "#fecaca"}`,
                }}
              >
                {facebookAcc?.status === "CONNECTED" ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>

            {facebookAcc?.status === "CONNECTED" ? (
              <div style={{ fontSize: 12, color: "#4a3e52", background: "#f8fafd", padding: "10px 12px", borderRadius: 6, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, color: "#1877f2" }}>{facebookAcc.accountName}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Page ID: <code>{facebookAcc.targetId}</code> {facebookAcc.fanCount ? `(${facebookAcc.fanCount.toLocaleString()} followers)` : ""}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                  Category: {facebookAcc.category || "IT & Broadcast"}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#7b6f84", margin: "0 0 14px" }}>
                Connect to Facebook to choose from your managed pages and publish posts automatically.
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1edf3", paddingTop: 12 }}>
            {facebookAcc?.status === "CONNECTED" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFbStep("TOKEN");
                    setShowFacebookModal(true);
                  }}
                  className="btn btn-outline btn-xs"
                  style={{ flex: 1 }}
                >
                  Switch Page
                </button>
                <button
                  type="button"
                  onClick={() => handleDisconnect("FACEBOOK")}
                  className="btn btn-outline btn-xs"
                  style={{ color: "#dc2626", borderColor: "#fecaca" }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFbStep("TOKEN");
                  setShowFacebookModal(true);
                }}
                className="btn btn-sm btn-pink"
                style={{ width: "100%", background: "#1877f2", borderColor: "#1877f2" }}
              >
                <Plus size={14} /> Connect to Facebook
              </button>
            )}
          </div>
        </div>

        {/* Instagram Card */}
        <div
          style={{
            background: "#ffffff",
            border: `1.5px solid ${instagramAcc?.status === "CONNECTED" ? "#fbcfe8" : "#eae4eb"}`,
            borderRadius: 10,
            padding: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                  }}
                >
                  <Instagram size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2b0d3a" }}>Instagram Business</div>
                  <div style={{ fontSize: 11, color: "#7b6f84" }}>Linked via Meta Graph</div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: instagramAcc?.status === "CONNECTED" ? "#ecfdf5" : "#fef2f2",
                  color: instagramAcc?.status === "CONNECTED" ? "#059669" : "#dc2626",
                  border: `1px solid ${instagramAcc?.status === "CONNECTED" ? "#a7f3d0" : "#fecaca"}`,
                }}
              >
                {instagramAcc?.status === "CONNECTED" ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>

            {instagramAcc?.status === "CONNECTED" ? (
              <div style={{ fontSize: 12, color: "#4a3e52", background: "#fdf2f8", padding: "10px 12px", borderRadius: 6, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, color: "#e11d72" }}>{instagramAcc.accountName}</div>
                <div style={{ fontSize: 11, color: "#831843", marginTop: 2 }}>
                  Account ID: <code>{instagramAcc.targetId}</code>
                </div>
                <div style={{ fontSize: 10, color: "#be185d", marginTop: 4 }}>
                  Auto-linked to Facebook Page
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#7b6f84", margin: "0 0 14px" }}>
                Auto-detected when you connect your Facebook Page with an attached Instagram professional account.
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1edf3", paddingTop: 12 }}>
            {instagramAcc?.status === "CONNECTED" ? (
              <button
                type="button"
                onClick={() => handleDisconnect("INSTAGRAM")}
                className="btn btn-outline btn-xs"
                style={{ width: "100%", color: "#dc2626", borderColor: "#fecaca" }}
              >
                Disconnect Instagram
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFbStep("TOKEN");
                  setShowFacebookModal(true);
                }}
                className="btn btn-sm btn-pink"
                style={{ width: "100%", background: "#e11d72", borderColor: "#e11d72" }}
              >
                Link with Facebook Page
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Publishing Studio */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "flex-start" }}>
        {/* Left: Compose Form */}
        <div style={{ background: "#ffffff", border: "1px solid #eae4eb", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#2b0d3a" }}>Post Composer</h3>
            <span style={{ fontSize: 12, color: "#7b6f84" }}>Publish everywhere with 1 click</span>
          </div>

          {/* Platform Toggles */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4a3e52", marginBottom: 8 }}>
              Publishing Targets:
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => togglePlatform("LINKEDIN")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: selectedPlatforms.includes("LINKEDIN") ? "1.5px solid #0a66c2" : "1.5px solid #eae4eb",
                  background: selectedPlatforms.includes("LINKEDIN") ? "#eff6ff" : "#ffffff",
                  color: selectedPlatforms.includes("LINKEDIN") ? "#0a66c2" : "#7b6f84",
                }}
              >
                <Linkedin size={15} /> LinkedIn
                {selectedPlatforms.includes("LINKEDIN") && <CheckCircle2 size={13} color="#0a66c2" />}
              </button>

              <button
                type="button"
                onClick={() => togglePlatform("FACEBOOK")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: selectedPlatforms.includes("FACEBOOK") ? "1.5px solid #1877f2" : "1.5px solid #eae4eb",
                  background: selectedPlatforms.includes("FACEBOOK") ? "#eff6ff" : "#ffffff",
                  color: selectedPlatforms.includes("FACEBOOK") ? "#1877f2" : "#7b6f84",
                }}
              >
                <Facebook size={15} /> Facebook
                {selectedPlatforms.includes("FACEBOOK") && <CheckCircle2 size={13} color="#1877f2" />}
              </button>

              <button
                type="button"
                onClick={() => togglePlatform("INSTAGRAM")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: selectedPlatforms.includes("INSTAGRAM") ? "1.5px solid #e11d72" : "1.5px solid #eae4eb",
                  background: selectedPlatforms.includes("INSTAGRAM") ? "#fdf2f8" : "#ffffff",
                  color: selectedPlatforms.includes("INSTAGRAM") ? "#e11d72" : "#7b6f84",
                }}
              >
                <Instagram size={15} /> Instagram
                {selectedPlatforms.includes("INSTAGRAM") && <CheckCircle2 size={13} color="#e11d72" />}
              </button>
            </div>
          </div>

          {/* Post Content Input */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a3e52" }}>Post Text / Commentary:</label>
              <span style={{ fontSize: 11, color: content.length > 2500 ? "#dc2626" : "#7b6f84" }}>
                {content.length} characters
              </span>
            </div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement, engineering achievement, or product update here..."
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #dcd4e1",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "inherit",
                lineHeight: 1.6,
                color: "#2b0d3a",
              }}
            />

            {/* Quick Hashtags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {["#Broadcasting", "#PlayoutAutomation", "#Simulcast", "#NepalTech", "#IPTV", "#AI"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev} ${tag}` : tag))}
                  className="btn btn-outline btn-xs"
                  style={{ fontSize: 11, padding: "2px 8px" }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Media / Image Attachment */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4a3e52", marginBottom: 6 }}>
              Media Attachment (Image / Visual):
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Path or URL: /media/control-room-concept.webp"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #dcd4e1",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              {mediaUrl && (
                <button
                  type="button"
                  onClick={() => setMediaUrl("")}
                  className="btn btn-outline btn-xs"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Visual Presets Selector */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
              {visualPresets.map((vp) => (
                <button
                  key={vp.url}
                  type="button"
                  onClick={() => setMediaUrl(vp.url)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    background: mediaUrl === vp.url ? "#fdf2f8" : "#f8f6f9",
                    border: `1px solid ${mediaUrl === vp.url ? "#f472b6" : "#e5e0e8"}`,
                    color: mediaUrl === vp.url ? "#be185d" : "#4a3e52",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  <ImageIcon size={12} /> {vp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Warning if none connected */}
          {accounts.length === 0 && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: 6,
                fontSize: 12,
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0 }} />
              <span>
                <strong>No social accounts connected.</strong> Connect your LinkedIn Company Page or Facebook Page above to enable live broadcasting.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={posting || !content.trim() || accounts.length === 0}
            className="btn btn-pink btn-md"
            style={{ width: "100%", justifyContent: "center", gap: 8 }}
          >
            {posting ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> Publishing Cross-Platform...
              </>
            ) : (
              <>
                <Send size={15} /> Publish to Selected Platforms ({selectedPlatforms.length})
              </>
            )}
          </button>
        </div>

        {/* Right: Live Interactive Card Preview */}
        <div style={{ background: "#ffffff", border: "1px solid #eae4eb", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: "#2b0d3a" }}>Live Channel Preview</h4>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => setPreviewPlatform("LINKEDIN")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: previewPlatform === "LINKEDIN" ? "1px solid #0a66c2" : "1px solid transparent",
                  background: previewPlatform === "LINKEDIN" ? "#eff6ff" : "transparent",
                  color: previewPlatform === "LINKEDIN" ? "#0a66c2" : "#7b6f84",
                }}
              >
                LinkedIn
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlatform("FACEBOOK")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: previewPlatform === "FACEBOOK" ? "1px solid #1877f2" : "1px solid transparent",
                  background: previewPlatform === "FACEBOOK" ? "#eff6ff" : "transparent",
                  color: previewPlatform === "FACEBOOK" ? "#1877f2" : "#7b6f84",
                }}
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlatform("INSTAGRAM")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: previewPlatform === "INSTAGRAM" ? "1px solid #e11d72" : "1px solid transparent",
                  background: previewPlatform === "INSTAGRAM" ? "#fdf2f8" : "transparent",
                  color: previewPlatform === "INSTAGRAM" ? "#e11d72" : "#7b6f84",
                }}
              >
                Instagram
              </button>
            </div>
          </div>

          {/* LinkedIn Preview Style */}
          {previewPlatform === "LINKEDIN" && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#ffffff" }}>
              <div style={{ padding: 14, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/media/logo-mark.png" alt="Simulcast" style={{ width: 42, height: 42, borderRadius: 4 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Simulcast Technologies Pvt. Ltd.</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Broadcast & Telecom Engineering &bull; Just now &bull; 🌐</div>
                </div>
              </div>
              <div style={{ padding: 14, fontSize: 13, color: "#1e293b", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {content || "Your post commentary and announcement text will appear here formatted for LinkedIn followers."}
              </div>
              {mediaUrl && (
                <div style={{ maxHeight: 260, overflow: "hidden", background: "#0f172a" }}>
                  <img src={mediaUrl} alt="Preview" style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ padding: "8px 14px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-around", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><ThumbsUp size={14} /> Like</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MessageSquare size={14} /> Comment</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Repeat2 size={14} /> Repost</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Send size={14} /> Send</span>
              </div>
            </div>
          )}

          {/* Facebook Preview Style */}
          {previewPlatform === "FACEBOOK" && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#ffffff" }}>
              <div style={{ padding: 14, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/media/logo-mark.png" alt="Simulcast" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Simulcast Technologies</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Just now &bull; Public</div>
                </div>
              </div>
              <div style={{ padding: 14, fontSize: 13, color: "#1e293b", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {content || "Your Facebook status update will look clean, legible, and engaging for your page community."}
              </div>
              {mediaUrl && (
                <div style={{ maxHeight: 260, overflow: "hidden" }}>
                  <img src={mediaUrl} alt="Preview" style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ padding: "8px 14px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-around", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><ThumbsUp size={14} /> Like</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MessageCircle size={14} /> Comment</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Share2 size={14} /> Share</span>
              </div>
            </div>
          )}

          {/* Instagram Preview Style */}
          {previewPlatform === "INSTAGRAM" && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#ffffff" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/media/logo-mark.png" alt="Simulcast" style={{ width: 34, height: 34, borderRadius: "50%", padding: 2, border: "2px solid #e11d72" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }}>simulcast_technologies</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>Kathmandu, Nepal</div>
                </div>
              </div>
              <div style={{ aspectRatio: "1/1", overflow: "hidden", background: "#1e1026" }}>
                <img
                  src={mediaUrl || "/media/control-room-concept.webp"}
                  alt="Instagram Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "10px 14px", display: "flex", gap: 14, color: "#0f172a" }}>
                <Heart size={18} />
                <MessageCircle size={18} />
                <Send size={18} />
              </div>
              <div style={{ padding: "0 14px 14px", fontSize: 12, color: "#1e293b", lineHeight: 1.5 }}>
                <strong style={{ marginRight: 6 }}>simulcast_technologies</strong>
                {content ? content.slice(0, 160) + (content.length > 160 ? "..." : "") : "Photo caption will appear here on user feeds."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Publication History Table */}
      <div style={{ background: "#ffffff", border: "1px solid #eae4eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eae4eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, color: "#2b0d3a" }}>Published Social Feed History</h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#7b6f84" }}>
              Log of posts published across LinkedIn, Facebook, and Instagram
            </p>
          </div>
          <span style={{ fontSize: 12, color: "#7b6f84" }}>{posts.length} records</span>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Content Snippet</th>
                <th>Media</th>
                <th>Dispatched Targets</th>
                <th>Overall Status</th>
                <th>Author</th>
                <th>Published At</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "#7b6f84" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <Share2 size={32} color="#c8bccb" />
                      <strong style={{ fontSize: 14, color: "#2b0d3a" }}>No Social Posts Published Yet</strong>
                      <p style={{ margin: 0, fontSize: 12, color: "#8a7e92", maxWidth: 440 }}>
                        Connect your LinkedIn or Facebook channels above, then compose your first announcement in the Post Composer to publish across official channels.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontSize: 12, color: "#2b0d3a", lineHeight: 1.4, fontWeight: 500 }}>
                        {p.content.slice(0, 120)}
                        {p.content.length > 120 ? "..." : ""}
                      </div>
                    </td>
                    <td>
                      {p.mediaUrl ? (
                        <img
                          src={p.mediaUrl}
                          alt=""
                          style={{ width: 44, height: 32, borderRadius: 4, objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Text only</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {p.platforms.map((plat) => (
                          <a
                            key={plat.platform}
                            href={plat.postUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              textDecoration: "none",
                              background: plat.status === "PUBLISHED" ? "#f0fdf4" : "#fef2f2",
                              color: plat.status === "PUBLISHED" ? "#16a34a" : "#dc2626",
                              border: `1px solid ${plat.status === "PUBLISHED" ? "#bbf7d0" : "#fecaca"}`,
                            }}
                          >
                            {plat.platform}
                            {plat.postUrl && <ExternalLink size={9} />}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 12,
                          background: p.status === "PUBLISHED" ? "#ecfdf5" : p.status === "PARTIAL" ? "#fefce8" : "#fef2f2",
                          color: p.status === "PUBLISHED" ? "#059669" : p.status === "PARTIAL" ? "#b45309" : "#dc2626",
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{p.author}</td>
                    <td style={{ fontSize: 11, color: "#64748b" }}>
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Connect LinkedIn */}
      {showLinkedInModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLinkedInModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(18, 10, 25, 0.78)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            className="admin-modal-card"
            style={{
              maxWidth: 540,
              width: "100%",
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 25px 80px rgba(18, 10, 25, 0.45)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              margin: "auto",
            }}
          >
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Linkedin size={18} color="#0a66c2" />
                <h3 style={{ margin: 0, fontSize: 16 }}>Connect LinkedIn Page</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkedInModal(false)}
                className="btn btn-outline btn-xs"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Account / Organization Display Name:
                </label>
                <input
                  type="text"
                  value={liAccountName}
                  onChange={(e) => setLiAccountName(e.target.value)}
                  placeholder="e.g. Simulcast Nepal or Kalyan Karn"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  LinkedIn App Client ID:
                </label>
                <input
                  type="text"
                  value={liClientId}
                  onChange={(e) => setLiClientId(e.target.value)}
                  placeholder="Enter your Client ID from LinkedIn Developer Portal"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Publishing Role / Target Type:
                </label>
                <div style={{ display: "flex", gap: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="radio"
                      checked={liAccountType === "ORGANIZATION"}
                      onChange={() => setLiAccountType("ORGANIZATION")}
                    />
                    Official Organization Page
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="radio"
                      checked={liAccountType === "PROFILE"}
                      onChange={() => setLiAccountType("PROFILE")}
                    />
                    Personal Member Profile
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Author URN (Required for posting):
                </label>
                <input
                  type="text"
                  value={liOrgUrn}
                  onChange={(e) => setLiOrgUrn(e.target.value)}
                  placeholder={liAccountType === "ORGANIZATION" ? "urn:li:organization:{numericId}" : "urn:li:person:{personSub}"}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
                <span style={{ fontSize: 11, color: "#8a7e92", marginTop: 3, display: "block" }}>
                  {liAccountType === "ORGANIZATION"
                    ? "Find your numeric Organization ID from your LinkedIn Company Page admin URL (e.g. urn:li:organization:12345678)."
                    : "Your personal LinkedIn member URN (automatically filled when signing in with OAuth)."}
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  LinkedIn OAuth / Access Token:
                </label>
                <input
                  type="password"
                  value={liToken}
                  onChange={(e) => setLiToken(e.target.value)}
                  placeholder="Paste LinkedIn Access Token (or click Sign in with LinkedIn below)"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#f8fafd", border: "1px solid #e2e8f0", padding: "10px 12px", borderRadius: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>
                  OAuth Scope Selection:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer", color: "#334155" }}>
                    <input
                      type="radio"
                      name="liScope"
                      checked={!liUseOpenId}
                      onChange={() => setLiUseOpenId(false)}
                      style={{ marginTop: 2 }}
                    />
                    <span>
                      <strong>Publishing Only (<code>w_member_social</code>)</strong><br/>
                      <span style={{ color: "#059669", fontWeight: 600 }}>Active on your LinkedIn app</span> — Posts to personal or company profiles.
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer", color: "#334155" }}>
                    <input
                      type="radio"
                      name="liScope"
                      checked={liUseOpenId}
                      onChange={() => setLiUseOpenId(true)}
                      style={{ marginTop: 2 }}
                    />
                    <span>
                      <strong>Publishing + OpenID Profile (<code>openid profile w_member_social email</code>)</strong><br/>
                      <span style={{ color: "#64748b" }}>Requires &ldquo;Sign In with LinkedIn using OpenID Connect&rdquo; added in Products tab.</span>
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ background: "#f8fafd", border: "1px solid #e2e8f0", padding: "10px 12px", borderRadius: 6, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                <strong style={{ color: "#0a66c2" }}>Official OAuth Redirect URL:</strong><br/>
                Add this exact URI in your LinkedIn Developer Portal &gt; Auth &gt; Authorized redirect URLs:<br/>
                <code style={{ wordBreak: "break-all", background: "#eef2ff", padding: "2px 6px", borderRadius: 3, display: "inline-block", marginTop: 4 }}>
                  {typeof window !== "undefined" ? window.location.origin : "https://simulcast.com.np"}/api/social/callback/linkedin
                </code>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowLinkedInModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!liClientId || !liClientId.trim()) {
                      toast.error("Please enter your LinkedIn Client ID above or save it in API Keys & OAuth!");
                      return;
                    }
                    const redirectUri = encodeURIComponent(`${window.location.origin}/api/social/callback/linkedin`);
                    const scope = liUseOpenId ? "openid%20profile%20w_member_social%20email" : "w_member_social";
                    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(liClientId.trim())}&redirect_uri=${redirectUri}&scope=${scope}`;
                    window.location.href = authUrl;
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: "#0a66c2", color: "#0a66c2" }}
                >
                  <Linkedin size={13} style={{ marginRight: 4 }} /> Sign in with Official OAuth
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveLinkedIn}
                className="btn btn-pink btn-sm"
                style={{ background: "#0a66c2", borderColor: "#0a66c2" }}
              >
                Save & Connect Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Connect Facebook & Choose Page Flow */}
      {showFacebookModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFacebookModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(18, 10, 25, 0.78)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            className="admin-modal-card"
            style={{
              maxWidth: 580,
              width: "100%",
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 25px 80px rgba(18, 10, 25, 0.45)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              margin: "auto",
            }}
          >
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Facebook size={18} color="#1877f2" />
                <h3 style={{ margin: 0, fontSize: 16 }}>Connect Facebook Page & Instagram</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFacebookModal(false)}
                className="btn btn-outline btn-xs"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {fbStep === "TOKEN" ? (
                <>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    Connect using official Meta OAuth 2.0 or paste a User Access Token from Graph API Explorer to discover and link your Facebook Pages &amp; attached Instagram Business accounts.
                  </p>

                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#166534", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Facebook size={14} color="#1877f2" /> Option 1: Official Meta OAuth 2.0 (Recommended)
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 3 }}>
                        Meta Developer App ID:
                      </label>
                      <input
                        type="text"
                        value={fbAppId}
                        onChange={(e) => setFbAppId(e.target.value)}
                        placeholder="Enter your Meta App ID from developers.facebook.com"
                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 12 }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!fbAppId || !fbAppId.trim()) {
                          toast.error("Please enter your Meta App ID above or in API Keys & OAuth!");
                          return;
                        }
                        const redirectUri = encodeURIComponent(`${window.location.origin}/api/social/callback/facebook`);
                        const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(fbAppId.trim())}&redirect_uri=${redirectUri}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish&response_type=code`;
                        window.location.href = authUrl;
                      }}
                      className="btn btn-pink btn-sm"
                      style={{ background: "#1877f2", borderColor: "#1877f2", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Facebook size={13} /> Sign in with Official Meta OAuth
                    </button>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 8 }}>
                      Valid OAuth Redirect URI to register in Facebook Login settings:
                      <code style={{ display: "block", background: "#ffffff", padding: "2px 6px", borderRadius: 3, marginTop: 2, wordBreak: "break-all" }}>
                        {typeof window !== "undefined" ? window.location.origin : "https://www.simulcast.com.np"}/api/social/callback/facebook
                      </code>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}></div>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}></div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Option 2: Direct Meta User Access Token:
                    </label>
                    <input
                      type="password"
                      value={fbUserToken}
                      onChange={(e) => setFbUserToken(e.target.value)}
                      placeholder="Paste User Access Token (e.g. EAAB...)"
                      style={{ width: "100%", padding: "10px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                    />
                  </div>

                  <div style={{ background: "#f8fafd", padding: "10px 12px", borderRadius: 6, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>Required Meta Permissions for Graph Explorer:</div>
                    <code>pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish</code>
                    <div style={{ marginTop: 6 }}>
                      <a
                        href="https://developers.facebook.com/tools/explorer/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1877f2", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        Open Meta Graph API Explorer <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#2b0d3a", margin: 0 }}>
                      Choose which Facebook Page to connect:
                    </p>
                    <button
                      type="button"
                      onClick={() => setFbStep("TOKEN")}
                      className="btn btn-outline btn-xs"
                    >
                      Change Token
                    </button>
                  </div>

                  {fbDiscoveredPages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 16px", background: "#f8fafd", borderRadius: 8, color: "#64748b", fontSize: 12 }}>
                      No Facebook Pages found associated with this user access token.
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                        Ensure your user account is an Administrator or Task editor of the Facebook Business Page.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {fbDiscoveredPages.map((page) => (
                        <div
                          key={page.id}
                          style={{
                            border: "1.5px solid #eae4eb",
                            borderRadius: 8,
                            padding: 14,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#ffffff",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#2b0d3a" }}>{page.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                              {page.category} &bull; Page ID: <code>{page.id}</code>
                              {page.fanCount !== undefined ? ` &bull; ${page.fanCount.toLocaleString()} followers` : ""}
                            </div>
                            {page.instagramBusinessAccount && (
                              <div style={{ fontSize: 11, color: "#e11d72", marginTop: 6, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                <Instagram size={13} /> Linked Instagram: @{page.instagramBusinessAccount.username}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConnectChosenPage(page)}
                            className="btn btn-sm btn-pink"
                            style={{ background: "#1877f2", borderColor: "#1877f2" }}
                          >
                            Connect Page
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="admin-modal-footer" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setShowFacebookModal(false);
                  setFbStep("TOKEN");
                }}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>

              {fbStep === "TOKEN" && (
                <button
                  type="button"
                  onClick={() => handleFetchFacebookPages()}
                  disabled={fbLoadingPages || !fbUserToken.trim()}
                  className="btn btn-pink btn-sm"
                  style={{ background: "#1877f2", borderColor: "#1877f2" }}
                >
                  {fbLoadingPages ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Fetching Pages...
                    </>
                  ) : (
                    "Discover & Choose Managed Pages"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: API Settings */}
      {showSettingsModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettingsModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(18, 10, 25, 0.78)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            className="admin-modal-card"
            style={{
              maxWidth: 520,
              width: "100%",
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 25px 80px rgba(18, 10, 25, 0.45)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              margin: "auto",
            }}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: 16 }}>Social API Configuration</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-outline btn-xs"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>LinkedIn Client ID:</label>
                <input
                  type="text"
                  value={liClientId}
                  onChange={(e) => setLiClientId(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>LinkedIn Client Secret:</label>
                <input
                  type="password"
                  value={liClientSecret}
                  onChange={(e) => setLiClientSecret(e.target.value)}
                  placeholder="Enter secret from LinkedIn Developer Portal"
                  style={{ width: "100%", padding: "8px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Facebook App ID:</label>
                <input
                  type="text"
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                  placeholder="Meta Developer App ID"
                  style={{ width: "100%", padding: "8px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Facebook App Secret:</label>
                <input
                  type="password"
                  value={fbAppSecret}
                  onChange={(e) => setFbAppSecret(e.target.value)}
                  placeholder="Meta Developer App Secret"
                  style={{ width: "100%", padding: "8px", border: "1px solid #dcd4e1", borderRadius: 4, fontSize: 12 }}
                />
              </div>
            </div>
            <div className="admin-modal-footer" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/social/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        linkedinClientId: liClientId,
                        linkedinClientSecret: liClientSecret,
                        facebookAppId: fbAppId,
                        facebookAppSecret: fbAppSecret,
                      }),
                    });
                    if (res.ok) {
                      toast.success("Social settings saved!");
                      setShowSettingsModal(false);
                    }
                  } catch {
                    toast.error("Failed saving settings");
                  }
                }}
                className="btn btn-pink btn-sm"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
