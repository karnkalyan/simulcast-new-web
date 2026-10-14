# Simulcast Technologies — Model Context Protocol (MCP) & ChatGPT Integration Guide

This document provides complete instructions for connecting **ChatGPT Custom GPTs**, **Claude Desktop**, **Cursor IDE**, and custom clients to the **Simulcast Technologies Model Context Protocol (MCP) Server**.

---

## 1. Overview & Protocol Specification

The Simulcast MCP server implements the **Model Context Protocol (spec 2024-11-05)** and **JSON-RPC 2.0**, exposing mission-critical broadcast engineering services, custom software platforms, real-world Nepal projects, automated lead logging, live human agent escalation, and Gemini 2.5 Flash knowledge retrieval.

### Active Endpoints

| Protocol / Transport | Endpoint | Description |
| :--- | :--- | :--- |
| **HTTP JSON-RPC 2.0** | `https://www.simulcast.com.np/api/mcp` | Primary MCP endpoint for ChatGPT Actions, REST, and JSON-RPC tools |
| **Server-Sent Events (SSE)** | `https://www.simulcast.com.np/api/mcp/sse` | Streaming MCP connection for Claude Desktop and MCP CLI |
| **WebSocket (Same Port)** | `ws://localhost:3000/api/ws` | Unified single-port real-time bi-directional streaming transport |
| **WebSocket Info & Ping** | `https://www.simulcast.com.np/api/mcp/ws` | Connection health, status, and handshake telemetry |

---

## 2. Authentication & Security Architecture

The MCP server enforces strict authentication on all requests using **Bearer Token verification**, **Encrypted JWT Tokens**, or custom headers.

### Authentication Credentials

1. **Master MCP Root Key**:
   ```
   simulcast_master_mcp_api_key_2026_sec
   ```
   *Granted full administrative access to tools, database operations, and live human escalation alerts.*

2. **Active 1-Year JWT Token**:
   ```
   eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiTUNQIiwicm9sZSI6Ik1DUF9DTElFTlQiLCJzdWIiOiJNQ1AiLCJpYXQiOjE3OTIwMDIxMTUsImV4cCI6MTgyMzUzODExNX0.EVSjZQv-e02Zpo_aqhpK-EuSz7UqvmVD9hFOEg2_wxE
   ```
   *Valid for 1 Year (Expires October 2027) with MCP client permissions.*


### HTTP Header Formats

You can pass the token via either standard Bearer header or custom header:

```http
Authorization: Bearer simulcast_master_mcp_api_key_2026_sec
```
*or*
```http
x-mcp-key: simulcast_master_mcp_api_key_2026_sec
```

---

## 3. Available MCP Tools Reference

### 1. `get_site_settings`
Returns official company identity, live brand colors, headline, subheadline, slogans, contact details, and location.
- **Input**: None `{}`
- **Output**: JSON object with company profile.

### 2. `list_services`
Queries the database for active broadcast engineering, custom software, AI automation, and IT infrastructure services.
- **Parameters**:
  - `category` *(optional string)*: Filter services by discipline.

### 3. `list_projects`
Retrieves showcase real-world technology deployments engineered by Simulcast Technologies in Nepal.
- **Parameters**:
  - `featuredOnly` *(optional boolean)*: Returns only spotlight/featured projects.

### 4. `submit_inquiry`
Logs a new customer inquiry directly into the Admin Inquiries system.
- **Parameters**:
  - `name` *(string, required)*: Contact person's full name.
  - `email` *(string, required)*: Business email address.
  - `organization` *(string)*: Company or institution name.
  - `phone` *(string)*: Telephone or mobile number.
  - `interest` *(string)*: Service of interest (e.g., Playout, IPTV, OTT, NRCS, Software, AI).
  - `message` *(string, required)*: Project description or query.

### 5. `request_human_agent`
**Triggers immediate human escalation!**
- Sends instant email notifications to:
  - `info@simulcast.com.np`
  - `support@simulcast.com.np`
- Flags the chat session in the Admin Live Chat Console as `ESCALATED_HUMAN`.
- **Parameters**:
  - `message` *(string, required)*: The reason human assistance is needed.
  - `visitorName` *(string)*: Name of the visitor.
  - `visitorEmail` *(string)*: Contact email.
  - `sessionId` *(string)*: Optional existing session ID.

### 6. `ask_simulcast_ai`
Queries the Gemini 2.5 Flash knowledge model for expert broadcast and software consulting answers.
- **Parameters**:
  - `query` *(string, required)*: The technical or solution question.

### 7. `get_chat_history`
Returns complete message transcript for an existing chat session.
- **Parameters**:
  - `sessionId` *(string, required)*: Target session ID.

---

## 4. ChatGPT Custom GPT Setup (OpenAPI Action)

To connect ChatGPT to Simulcast:

1. Open **ChatGPT → Explore GPTs → Create a GPT**.
2. Go to the **Configure** tab.
3. Under **Actions**, click **Create new action**.
4. In **Authentication**:
   - Authentication Type: `API Key`
   - Auth Type: `Bearer`
   - API Key: `simulcast_master_mcp_api_key_2026_sec`
5. In **Schema**, paste the following OpenAPI 3.1 definition:

```yaml
openapi: 3.1.0
info:
  title: Simulcast Technologies MCP Tools API
  description: Official Model Context Protocol tools for Simulcast Technologies broadcast, software and AI systems in Nepal.
  version: 1.0.0
servers:
  - url: https://www.simulcast.com.np/api
    description: Production Server
  - url: http://localhost:3000/api
    description: Local Development Server

paths:
  /mcp:
    post:
      operationId: invokeMcpAction
      summary: Execute Simulcast MCP Tool
      description: Invokes a registered tool method on the Simulcast MCP server.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - jsonrpc
                - method
                - params
              properties:
                jsonrpc:
                  type: string
                  example: "2.0"
                id:
                  type: integer
                  example: 1
                method:
                  type: string
                  enum:
                    - initialize
                    - tools/list
                    - tools/call
                    - resources/list
                    - resources/read
                  example: "tools/call"
                params:
                  type: object
                  properties:
                    name:
                      type: string
                      description: Tool name (e.g. get_site_settings, list_services, list_projects, submit_inquiry, request_human_agent, ask_simulcast_ai)
                      example: "list_services"
                    arguments:
                      type: object
                      description: Tool-specific arguments
                      example: {}
      responses:
        '200':
          description: Tool execution response
          content:
            application/json:
              schema:
                type: object
                properties:
                  jsonrpc:
                    type: string
                  id:
                    type: integer
                  result:
                    type: object
        '401':
          description: Unauthorized - Invalid API token

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
```

---

## 5. Claude Desktop Configuration

To use Simulcast MCP with Claude Desktop on Windows or macOS:

1. Open your Claude configuration file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add the following server configuration:

```json
{
  "mcpServers": {
    "simulcast-technologies": {
      "url": "http://localhost:3000/api/mcp/sse",
      "headers": {
        "Authorization": "Bearer simulcast_master_mcp_api_key_2026_sec"
      }
    }
  }
}
```

3. Restart Claude Desktop. You will see the Simulcast tools icon with hammer available in conversations.

---

## 6. Unified WebSocket Server (Same Port)

The WebSocket MCP server is unified with the Next.js server on **the exact same port (e.g. port 3000)**:

```bash
# Start unified HTTP + WebSocket server:
node server.mjs
```

### WebSocket Client Example (Node.js / Browser)

```javascript
import WebSocket from 'ws';

const TOKEN = 'simulcast_master_mcp_api_key_2026_sec';
// Connects to the SAME port as the website (port 3000):
const ws = new WebSocket(`ws://localhost:3000/api/ws?token=${TOKEN}`);

ws.on('open', () => {
  console.log('Connected to Simulcast MCP WebSocket (Single Port)');

  // Query available tools
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Received:', response);
});
```

---

## 7. Email Support & Human Escalation Dispatch

- **Live Human Support Alerts**:
  - Sent immediately when user asks to speak with a human engineer.
  - Dispatched to: `info@simulcast.com.np` & `support@simulcast.com.np`.
  - Email contains user identity, triggering message, current page URL, and 1-click link to open the Admin Chat console.
- **Chat Transcript Delivery**:
  - Sent automatically when a chat session concludes.
  - Dispatched to: `support@simulcast.com.np`.
  - Includes full chronological transcript with timestamps, user details, and response log.
