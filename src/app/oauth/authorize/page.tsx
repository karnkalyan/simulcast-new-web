"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, Bot, Sparkles, XCircle } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";
  const clientId = searchParams.get("client_id") || "chatgpt";
  const scope = searchParams.get("scope") || "mcp:read mcp:write admin";
  const codeChallenge = searchParams.get("code_challenge") || "";

  const [authMode, setAuthMode] = useState<"password" | "key">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeSession, setActiveSession] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    // Check if user is already signed in on this browser
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) {
          setActiveSession(data);
        }
      })
      .catch(() => {});
  }, []);

  async function handleAuthorize(useSession = false) {
    if (!redirectUri) {
      setError("Missing redirect_uri in authorization request.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const payload: Record<string, string> = {
        redirectUri,
        state,
        codeChallenge,
        scope,
      };

      if (!useSession) {
        if (authMode === "password") {
          if (!email || !password) {
            throw new Error("Please enter your Simulcast admin email and password.");
          }
          payload.email = email;
          payload.password = password;
        } else {
          if (!apiKey) {
            throw new Error("Please enter your MCP Secret Key or API Token.");
          }
          payload.apiKey = apiKey;
        }
      }

      const res = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authorization failed.");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to authorize");
      setBusy(false);
    }
  }

  function handleCancel() {
    if (redirectUri) {
      const target = new URL(redirectUri);
      target.searchParams.set("error", "access_denied");
      target.searchParams.set("error_description", "User rejected authorization");
      if (state) target.searchParams.set("state", state);
      window.location.href = target.toString();
    } else {
      window.close();
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 20%, #1e1338 0%, #0d0718 60%, #05020a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#f3f4f6"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "rgba(23, 15, 43, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(168, 85, 247, 0.25)",
        borderRadius: "20px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(168, 85, 247, 0.15)",
        padding: "36px 32px",
      }}>
        {/* Header with App Branding & Connector visual */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 16px rgba(168, 85, 247, 0.3)"
            }}>
              <Sparkles size={24} color="#fff" />
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "20px" }}>↔</div>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#10a37f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 16px rgba(16, 163, 127, 0.3)"
            }}>
              <Bot size={26} color="#fff" />
            </div>
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            Connect ChatGPT to Simulcast
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
            <strong>ChatGPT</strong> is requesting permission to access your Simulcast MCP server and tools.
          </p>
        </div>

        {/* Permissions list */}
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px"
        }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", color: "#c084fc", marginBottom: "10px" }}>
            Permissions Requested
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "13px", color: "#d1d5db", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span>Read services catalog, case studies & site details</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span>Submit customer leads & dispatch human support</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span>Manage insights, articles & site settings</span>
            </li>
          </ul>
        </div>

        {/* Authentication choice */}
        {activeSession ? (
          <div style={{
            background: "rgba(168, 85, 247, 0.1)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
            textAlign: "center"
          }}>
            <ShieldCheck size={28} color="#c084fc" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#f3f4f6" }}>
              Logged in as {activeSession.email}
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
              Role: {activeSession.role} · Authorized Administrator
            </div>
            <button
              type="button"
              onClick={() => setActiveSession(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#c084fc",
                fontSize: "12px",
                textDecoration: "underline",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              Sign in with a different account
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setAuthMode("password")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background: authMode === "password" ? "#a855f7" : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  transition: "all 0.2s"
                }}
              >
                Admin Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("key")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background: authMode === "key" ? "#a855f7" : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  transition: "all 0.2s"
                }}
              >
                Security Key / Token
              </button>
            </div>

            {authMode === "password" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#d1d5db", marginBottom: "6px" }}>
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@simulcast.com.np"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#d1d5db", marginBottom: "6px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#d1d5db", marginBottom: "6px" }}>
                  MCP Master Key or API Token
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="simulcast_master_mcp_api_key_2026_sec or JWT"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize: "13px",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#9ca3af",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleAuthorize(!!activeSession)}
            disabled={busy}
            style={{
              flex: 2,
              padding: "12px 16px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: busy ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 8px 20px rgba(168, 85, 247, 0.35)",
              transition: "all 0.2s",
              opacity: busy ? 0.7 : 1
            }}
          >
            <span>{busy ? "Authorizing…" : "Authorize & Connect"}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
          Simulcast Technologies Pvt. Ltd. · Secure OAuth 2.0 Provider
        </div>
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05020a", color: "#fff" }}>
        Loading authorization request…
      </div>
    }>
      <AuthorizeContent />
    </Suspense>
  );
}
