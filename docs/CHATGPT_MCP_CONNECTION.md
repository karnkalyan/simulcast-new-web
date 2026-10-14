# ChatGPT MCP Connection Guide — Simulcast Technologies

This guide provides the exact configuration details to connect **ChatGPT** to the **Simulcast Technologies Model Context Protocol (MCP) Server** via ChatGPT's native MCP connector dialog.

**Base Production Domain**: `https://www.simulcast.com.np` (or `https://simulcast.com.np`)

---

## 1. Quick Form Cheat Sheet (ChatGPT MCP Connector)

When configuring the connector in ChatGPT (**Settings → Connected apps** or **Create custom GPT / Action**):

| ChatGPT Form Field | Recommended Value (OAuth) | Fast Value (No Auth) |
| :--- | :--- | :--- |
| **Name** | `Simulcast Technologies` | `Simulcast Technologies` |
| **Description** *(optional)* | `Simulcast broadcast engineering, software platforms, inquiry logging, live chat, and AI consulting.` | `Simulcast broadcast & software inquiries.` |
| **Connection / Server URL** | `https://www.simulcast.com.np/api/mcp` | `https://www.simulcast.com.np/api/mcp` |
| **Authentication** | **OAuth** | **No authentication** |
| **Client registration** | **Dynamic Client Registration (DCR)** *(Automated)* OR **User-Defined OAuth Client** | — |
| **OAuth client ID** | `chatgpt-mcp` *(Auto-generated if using DCR)* | — |
| **OAuth client secret** | `eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiTUNQIiwicm9sZSI6Ik1DUF9DTElFTlQiLCJzdWIiOiJNQ1AiLCJpYXQiOjE3OTIwMDIxMTUsImV4cCI6MTgyMzUzODExNX0.EVSjZQv-e02Zpo_aqhpK-EuSz7UqvmVD9hFOEg2_wxE` | — |
| **Token endpoint auth method** | `client_secret_post` *(or `none`)* | — |
| **Default scopes** | `mcp:read mcp:write admin` | — |
| **Base scopes** | `mcp:read` | — |
| **Auth URL** | `https://www.simulcast.com.np/api/oauth/authorize` | — |
| **Token URL** | `https://www.simulcast.com.np/api/oauth/token` | — |
| **Registration URL** | `https://www.simulcast.com.np/api/oauth/register` | — |
| **Authorization server base** | `https://www.simulcast.com.np` *(or empty)* | — |
| **Resource** | `https://www.simulcast.com.np/api/mcp` *(or empty)* | — |
| **OpenID support (OIDC enabled)** | **OFF / Disabled** | — |

---

## 2. Active Authentication Tokens & Secrets

### 1-Year JWT API Token (Generated & Active)
```
eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiTUNQIiwicm9sZSI6Ik1DUF9DTElFTlQiLCJzdWIiOiJNQ1AiLCJpYXQiOjE3OTIwMDIxMTUsImV4cCI6MTgyMzUzODExNX0.EVSjZQv-e02Zpo_aqhpK-EuSz7UqvmVD9hFOEg2_wxE
```
* **Client Name**: `MCP`
* **Role**: `MCP_CLIENT`
* **Expiration**: Valid through October 2027 (1 Year)
* **Usage**:
  * For **ChatGPT Custom GPT Action (API Key)**: Auth Type `Bearer`, Key: *(paste token above)*
  * For **ChatGPT MCP Connector**: Can be used as `OAuth client secret`
  * For **Direct HTTP / cURL**: `Authorization: Bearer <token>` or `x-mcp-key: <token>`

### Master Root Key (Permanent Admin)
```
simulcast_master_mcp_api_key_2026_sec
```

---

## 3. Complete MCP Tool Suite (29 Tools)

ChatGPT can control the entire website, manage database records, respond to live website visitors, and alter site styling using the 29 tools below:

### A. Site Settings, Theme & Brand Control
1. **`get_site_settings`**: View company profile, headlines, slogans, theme colors, hero badges, contact info, and social links.
2. **`update_site_settings`**: Full brand and theme control. Allows updating:
   * `companyName`, `headline`, `subheadline`, `slogan`, `website`, `publicEmail`, `phone`, `address`
   * Social links: `facebook`, `linkedin`, `youtube`, `instagram`
   * Theme styling: `primaryColor`, `secondaryColor`, `heroBgColor`, `heroBadgeText`, `heroEmphasis`, `customCss`
   * Chat settings: `enableChat`, `chatGreeting`, `supportEmail`, `escalationEmail`

### B. Services Management (Full CRUD)
3. **`list_services`**: List all broadcast engineering, custom software, and AI services (supports `category` filter and `includeDrafts`).
4. **`get_service`**: Retrieve complete technical description, specifications, and architecture by `slug` or `id`.
5. **`create_service`**: Add and publish a new engineering service (`title`, `slug`, `summary`, `body`, `eyebrow`, `icon`, `imageUrl`, `sortOrder`, `published`).
6. **`update_service`**: Modify an existing service by `slug` or `id` (update title, slug, description, body, icon, image, ordering, or publish status).
7. **`delete_service`**: Permanently remove a service from the database by `slug` or `id` (destructive action requiring confirmation).

### C. Projects & Case Studies (Full CRUD)
8. **`list_projects`**: Retrieve showcase engineering projects deployed in Nepal (supports `category`, `featuredOnly`, and `includeDrafts`).
9. **`get_project`**: Retrieve detailed architecture study and specifications by `slug` or `id`.
10. **`create_project`**: Publish a new case study deployment (`title`, `slug`, `summary`, `body`, `category`, `location`, `imageUrl`, `featured`, `published`, `sortOrder`).
11. **`update_project`**: Modify an existing project by `slug` or `id`.
12. **`delete_project`**: Permanently remove a project by `slug` or `id` (destructive action requiring confirmation).

### D. Blog Posts & Insights (Full CRUD)
13. **`list_blog_posts`**: List all published articles and editorial engineering guides (supports `category` and `publishedOnly`).
14. **`get_blog_post`**: Retrieve the full article body and metadata by `slug` or `id`.
15. **`create_blog_post`**: Author and publish a new insight or article (`title`, `slug`, `excerpt`, `body`, `category`, `imageUrl`, `published`).
16. **`update_blog_post`**: Edit existing article title, excerpt, body, category, image, or publish status by `slug` or `id`.
17. **`delete_blog_post`**: Permanently remove a blog article by `slug` or `id` (destructive action requiring confirmation).

### E. Customer Inquiries & Leads (Full CRUD)
18. **`submit_inquiry`**: Log a customer inquiry or sales lead (`name`, `email`, `organization`, `phone`, `interest`, `message`).
19. **`list_inquiries`**: Review all customer contact queries and sales leads (supports status filter: `NEW`, `IN_PROGRESS`, `RESPONDED`, `CLOSED`, or `ALL`).
20. **`get_inquiry`**: View complete inquiry details, customer message, and internal staff notes by `id`.
21. **`update_inquiry`**: Update inquiry status and append internal follow-up notes by `id`.
22. **`delete_inquiry`**: Delete an inquiry record by `id` (destructive action requiring confirmation).

### F. Simulcast Live Chat System & Real-Time Messaging
23. **`list_chat_sessions`**: Monitor visitor live chat sessions, including visitor contact details, escalation status, and latest message previews (filter by `ACTIVE`, `ESCALATED_HUMAN`, `CLOSED`, or `ALL`).
24. **`get_chat_history`**: Retrieve the complete conversation transcript and timeline for any chat session by `sessionId`.
25. **`send_chat_message`**: Send a live reply directly into a visitor's chat session from ChatGPT as a support agent (`sessionId`, `content`, `sender`: "human_agent" or "bot", `senderName`). The live visitor sees the reply immediately!
26. **`update_chat_session`**: Update session metadata, visitor details, status, or staff resolution notes by `sessionId`.
27. **`close_chat_session`**: Close a chat session and optionally email the complete transcript to support and the visitor.
28. **`request_human_agent`**: Escalate a visitor chat session to engineering staff, triggering instant email notifications to `info@simulcast.com.np` and `support@simulcast.com.np`.

### G. AI Intelligence Engine
29. **`ask_simulcast_ai`**: Direct technical inquiry with Simulcast's embedded Gemini AI knowledge engine.

---

## 4. Example Prompts to Use with ChatGPT

Once connected to Simulcast Technologies, you can issue conversational instructions such as:

* **Site & Theme:**
  * *"Change our hero gradient emphasis to 'Next-Generation Broadcast & AI Infrastructure' and change the primary brand color to #1e1b4b."*
  * *"What are our current public contact details and social media links?"*
* **Services:**
  * *"List all our broadcast services."*
  * *"Add a new service: 'Cloud Playout & Disaster Recovery' with slug 'cloud-playout-dr'."*
  * *"Update the summary for the 'software-platforms' service to highlight custom Next.js web applications."*
* **Blog Posts:**
  * *"Show me all our blog posts and draft articles."*
  * *"Create a new blog post titled 'Building 24/7 Redundant Playout in Nepal' with slug 'building-247-redundant-playout-nepal'."*
  * *"Delete the draft blog post with slug 'test-draft'."*
* **Customer Leads:**
  * *"Check all new contact inquiries from today."*
  * *"Mark inquiry #cm12345 as IN_PROGRESS and add a note that an engineer called them back."*
* **Live Chat:**
  * *"Check if there are any active or escalated chat sessions waiting for assistance."*
  * *"Show me the full transcript of chat session #cm89012."*
  * *"Reply to visitor John in session #cm89012 saying: 'Hello John, our senior broadcast engineer will arrive on-site tomorrow at 10 AM. Is there anything else you need?'"*
  * *"Close chat session #cm89012 and email the transcript to support."*
