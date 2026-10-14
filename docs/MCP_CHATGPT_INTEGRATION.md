# Simulcast Technologies — Model Context Protocol (MCP) & ChatGPT Integration Guide

This document provides complete instructions for connecting **ChatGPT**, **Claude Desktop**, **Cursor IDE**, and custom clients to the **Simulcast Technologies Model Context Protocol (MCP) Server**.

---

## 1. Overview & Protocol Specification

The Simulcast MCP server implements the **Model Context Protocol (spec 2024-11-05)**, compliant with **OpenAI Apps SDK (2025/2026 specs)** and **JSON-RPC 2.0**. It exposes a complete management suite covering:
* **Site Settings & Brand Theme**: Headlines, slogans, colors (`primaryColor`, `secondaryColor`, `heroBgColor`), custom CSS, contact info.
* **Services**: Full CRUD (list, get, create, update, delete).
* **Projects**: Full CRUD (list, get, create, update, delete).
* **Blog Posts & Guides**: Full CRUD (list, get, create, update, delete) merging database records with static editorial guides.
* **Inquiries & Leads**: Full CRUD (submit, list, get, update status/notes, delete).
* **Live Chat System**: Monitor sessions, read transcripts, send live replies to visitors, escalate, and close sessions.
* **AI Engine**: Gemini 2.5 Flash knowledge retrieval.

### Active Endpoints

| Protocol / Transport | Endpoint | Description |
| :--- | :--- | :--- |
| **HTTP JSON-RPC 2.0** | `https://www.simulcast.com.np/api/mcp` | Primary MCP endpoint for ChatGPT Actions, REST, and JSON-RPC tools |
| **Server-Sent Events (SSE)** | `https://www.simulcast.com.np/api/mcp/sse` | Streaming MCP connection for Claude Desktop and MCP CLI |
| **WebSocket (Same Port)** | `ws://localhost:3000/api/ws` | Unified single-port real-time bi-directional streaming transport |
| **WebSocket Info & Ping** | `https://www.simulcast.com.np/api/mcp/ws` | Connection health, status, and handshake telemetry |
| **OAuth 2.0 Authorize UI** | `https://www.simulcast.com.np/oauth/authorize` | Branded interactive login & authorization dialog |
| **OAuth 2.0 Authorize API** | `https://www.simulcast.com.np/api/oauth/authorize` | OAuth code generation and consent handler |
| **OAuth 2.0 Token API** | `https://www.simulcast.com.np/api/oauth/token` | Token issuance endpoint (supports `client_secret_post` and `none`) |
| **OAuth 2.0 Registration (DCR)** | `https://www.simulcast.com.np/api/oauth/register` | RFC 7591 Dynamic Client Registration |

---

## 2. Authentication & Security Architecture

The MCP server enforces strict authentication on administrative and write operations using **Bearer Token verification**, **OAuth 2.0 JWTs**, or **x-mcp-key** headers. Public read operations (`get_site_settings`, `list_services`, `list_projects`, `list_blog_posts`, `ask_simulcast_ai`, `submit_inquiry`) remain accessible without credentials.

### Authentication Credentials

1. **Active 1-Year JWT Token**:
   ```
   eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiTUNQIiwicm9sZSI6Ik1DUF9DTElFTlQiLCJzdWIiOiJNQ1AiLCJpYXQiOjE3OTIwMDIxMTUsImV4cCI6MTgyMzUzODExNX0.EVSjZQv-e02Zpo_aqhpK-EuSz7UqvmVD9hFOEg2_wxE
   ```

2. **Master MCP Root Key**:
   ```
   simulcast_master_mcp_api_key_2026_sec
   ```

---

## 3. Complete MCP Tool Suite (29 Tools)

### A. Site Settings, Theme & Brand Control
* **`get_site_settings`**: View company details, slogans, contact info, and theme colors.
* **`update_site_settings`**: Update company name, headlines, slogans, theme colors (`primaryColor`, `secondaryColor`, `heroBgColor`), custom CSS, chat greeting, and contact info.

### B. Services Management (Full CRUD)
* **`list_services`**: List all services with category filtering and draft visibility.
* **`get_service`**: Retrieve detailed specifications and architecture by `slug` or `id`.
* **`create_service`**: Add and publish a new engineering service.
* **`update_service`**: Edit title, slug, summary, body, icon, image, ordering, or publish status.
* **`delete_service`**: Delete a custom service (destructive operation).

### C. Projects & Case Studies (Full CRUD)
* **`list_projects`**: Retrieve showcase projects deployed in Nepal.
* **`get_project`**: Retrieve detailed case study description and specs by `slug` or `id`.
* **`create_project`**: Publish a new case study deployment.
* **`update_project`**: Edit existing project details, featured status, or cover images.
* **`delete_project`**: Delete a project (destructive operation).

### D. Blog Posts & Insights (Full CRUD)
* **`list_blog_posts`**: List all published articles and editorial engineering guides.
* **`get_blog_post`**: Retrieve the full article body and metadata by `slug` or `id`.
* **`create_blog_post`**: Create and optionally publish a new insight or article.
* **`update_blog_post`**: Edit title, excerpt, body, category, image, or publish status.
* **`delete_blog_post`**: Delete a blog article (destructive operation).

### E. Customer Inquiries & Leads (Full CRUD)
* **`submit_inquiry`**: Log a customer inquiry or sales lead.
* **`list_inquiries`**: Review customer inquiries with status filtering (`NEW`, `IN_PROGRESS`, `RESPONDED`, `CLOSED`, `ALL`).
* **`get_inquiry`**: View full inquiry details and internal staff notes.
* **`update_inquiry`**: Update status and append internal notes / follow-up log.
* **`delete_inquiry`**: Delete an inquiry record (destructive operation).

### F. Simulcast Live Chat System & Real-Time Messaging
* **`list_chat_sessions`**: Monitor visitor chat sessions, status, and latest message previews.
* **`get_chat_history`**: Retrieve complete conversation transcript for any session.
* **`send_chat_message`**: Send a live reply directly to a website visitor from ChatGPT.
* **`update_chat_session`**: Update session status, visitor contact details, or staff summary notes.
* **`close_chat_session`**: Close a chat session and optionally email the complete transcript.
* **`request_human_agent`**: Trigger immediate human escalation with priority email notifications.

### G. AI Intelligence Engine
* **`ask_simulcast_ai`**: Direct technical inquiry with Simulcast's embedded Gemini AI knowledge engine.
