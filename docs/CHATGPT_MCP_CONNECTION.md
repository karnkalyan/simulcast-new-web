# ChatGPT MCP Connection Guide — Simulcast Technologies

This guide provides the exact configuration details to connect **ChatGPT** to the **Simulcast Technologies Model Context Protocol (MCP) Server** via ChatGPT's native MCP connector dialog.

**Base Production Domain**: `https://www.simulcast.com.np` (or `https://simulcast.com.np`)

---

## 1. Quick Form Cheat Sheet (ChatGPT MCP Connector)

When configuring the connector in ChatGPT (**Settings → Connected apps** or **Create custom GPT / Action**):

| ChatGPT Form Field | Recommended Value (OAuth) | Fast Value (No Auth) |
| :--- | :--- | :--- |
| **Name** | `Simulcast Technologies` | `Simulcast Technologies` |
| **Description** *(optional)* | `Simulcast broadcast engineering, software platforms, inquiry logging, and AI consulting.` | `Simulcast broadcast & software inquiries.` |
| **Connection / Server URL** | `https://www.simulcast.com.np/api/mcp` | `https://www.simulcast.com.np/api/mcp` |
| **Authentication** | **OAuth** | **No authentication** |
| **Client registration** | **User-Defined OAuth Client** | — |
| **OAuth client ID** | `chatgpt-mcp` *(or `simulcast-chatgpt`)* | — |
| **OAuth client secret** | `simulcast_master_mcp_api_key_2026_sec` | — |
| **Token endpoint auth method** | `client_secret_post` *(or `client_secret_basic`)* | — |
| **Default scopes** | `mcp:read mcp:write admin` | — |
| **Base scopes** | `mcp:read` | — |
| **Auth URL** | `https://www.simulcast.com.np/api/oauth/authorize` | — |
| **Token URL** | `https://www.simulcast.com.np/api/oauth/token` | — |
| **Registration URL** | *(Leave empty)* | — |
| **Authorization server base** | `https://www.simulcast.com.np` *(or empty)* | — |
| **Resource** | `https://www.simulcast.com.np/api/mcp` *(or empty)* | — |
| **OpenID support (OIDC enabled)** | **OFF / Disabled** | — |

---

## 2. Authentication Methods Explained

### Option A: OAuth (Recommended — Full Access)
* **What it enables**: All 12 tools, including administrative tasks, creating blog posts, updating site settings, inquiry dispatch, and human escalation.
* **How it works**:
  1. ChatGPT redirects to `https://www.simulcast.com.np/api/oauth/authorize`.
  2. The server generates an authorization code and immediately redirects back to ChatGPT's callback URL.
  3. ChatGPT POSTs this code to `https://www.simulcast.com.np/api/oauth/token`.
  4. The server returns a 30-day JWT Bearer token with `MCP_ADMIN` privileges.
  5. Subsequent tool calls include `Authorization: Bearer <token>`.

### Option B: No Authentication (Fastest — Public Read-Only)
* **What it enables**: Public tools without credentials:
  * `get_site_settings`
  * `list_services`
  * `list_projects`
  * `resources/list` (`simulcast://overview`, `simulcast://services`)
  * `resources/read`
* Tools requiring write privileges (`create_blog_post`, `update_site_settings`) will return an authentication challenge if invoked without a token.

---

## 3. Server Endpoints Reference

| Purpose | URL | Method | Auth |
| :--- | :--- | :--- | :--- |
| **MCP JSON-RPC 2.0** | `https://www.simulcast.com.np/api/mcp` | `POST`, `GET`, `OPTIONS` | Public for discovery & queries; Bearer for admin |
| **OAuth 2.0 Authorize** | `https://www.simulcast.com.np/api/oauth/authorize` | `GET` | Auto-approving redirect |
| **OAuth 2.0 Token** | `https://www.simulcast.com.np/api/oauth/token` | `POST`, `GET`, `OPTIONS` | Grants 30-day JWT |
| **OAuth Discovery** | `https://www.simulcast.com.np/.well-known/oauth-authorization-server` | `GET` | RFC 8414 metadata |
| **OpenID Discovery** | `https://www.simulcast.com.np/.well-known/openid-configuration` | `GET` | OIDC metadata |

---

## 4. Available MCP Tools Reference

1. **`get_site_settings`** — Retrieves official brand details, headlines, phone numbers, email, and office address.
2. **`list_services`** — Lists broadcast engineering, custom software, AI, and telecom infrastructure services (filter by `category`).
3. **`list_projects`** — Retrieves showcase projects deployed in Nepal (filter by `featuredOnly`).
4. **`submit_inquiry`** — Records customer inquiries (`name`, `email`, `organization`, `phone`, `interest`, `message`) into the system.
5. **`request_human_agent`** — Dispatches emergency escalation emails to `info@simulcast.com.np` & `support@simulcast.com.np`.
6. **`ask_simulcast_ai`** — Queries the Gemini 2.5 Flash knowledge engine with technical inquiries.
7. **`get_chat_history`** — Fetches full message transcripts by `sessionId`.
8. **`list_blog_posts`** — Queries articles and insights by category and publish status.
9. **`create_blog_post`** — Creates and publishes insights on the website *(admin only)*.
10. **`update_blog_post`** — Updates existing blog posts by slug *(admin only)*.
11. **`create_project`** — Publishes a new case study or showcase project *(admin only)*.
12. **`update_site_settings`** — Updates homepage headlines, phone, email, and office address *(admin only)*.

---

## 5. Testing on Localhost

If developing locally prior to pushing to `simulcast.com.np`:
ChatGPT cannot reach `http://localhost:3000` because OpenAI’s servers run in the cloud.

1. Start your local server:
   ```bash
   npm run dev
   ```
2. In a separate terminal, expose port 3000 via a tunnel:
   ```bash
   npx ngrok http 3000
   ```
3. Use the resulting HTTPS tunnel URL in ChatGPT (e.g. `https://xxxx.ngrok-free.app/api/mcp` and `https://xxxx.ngrok-free.app/api/oauth/...`).

---

## 6. Troubleshooting

* **"Failed to connect / SSL error"**: Ensure your base URL uses `https://` and is publicly reachable.
* **"OIDC userinfo error"**: Make sure **OIDC enabled** is toggled **OFF** in ChatGPT.
* **"CORS error"**: The server includes `OPTIONS` preflight handlers on `/api/mcp` and `/api/oauth/token` with `Access-Control-Allow-Origin: *`.
* **"Unauthorized on tool execution"**: Ensure **Token endpoint auth method** is set to `client_secret_post` and the default scopes include `mcp:read mcp:write admin`.
