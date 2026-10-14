import { WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';

const PORT = parseInt(process.env.MCP_WS_PORT || '3001', 10);
const prisma = new PrismaClient();
const MASTER_KEY = process.env.MCP_API_KEY || 'simulcast_master_mcp_api_key_2026_sec';

const wss = new WebSocketServer({ port: PORT });
console.log(`[Simulcast MCP WebSocket Server] Listening on ws://0.0.0.0:${PORT}`);

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const token = url.searchParams.get('token') || req.headers['sec-websocket-protocol'] || '';

  let authenticated = token === MASTER_KEY;
  let identity = authenticated ? 'Master Admin' : 'Unauthenticated';

  if (!authenticated && token) {
    try {
      const dbToken = await prisma.apiToken.findUnique({ where: { token } });
      if (dbToken && !dbToken.revoked) {
        authenticated = true;
        identity = dbToken.name;
        await prisma.apiToken.update({ where: { id: dbToken.id }, data: { lastUsedAt: new Date() } });
      }
    } catch (err) {
      console.error('[WS Auth Error]', err.message);
    }
  }

  console.log(`[WS Connection] Identity: ${identity}, Authenticated: ${authenticated}`);

  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'simulcast/connected',
    params: {
      server: 'Simulcast MCP WebSocket Server',
      version: '1.0.0',
      authenticated,
      identity,
      port: PORT
    }
  }));

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { id, method, params } = msg;

      if (!authenticated && method !== 'auth') {
        return ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id,
          error: { code: -32002, message: 'Unauthorized. Authenticate via { method: "auth", params: { token: "..." } }' }
        }));
      }

      if (method === 'auth') {
        const checkToken = params?.token;
        if (checkToken === MASTER_KEY) {
          authenticated = true;
          identity = 'Master Admin';
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { success: true, identity } }));
        }
        const dbT = await prisma.apiToken.findUnique({ where: { token: checkToken } });
        if (dbT && !dbT.revoked) {
          authenticated = true;
          identity = dbT.name;
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { success: true, identity } }));
        }
        return ws.send(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32002, message: 'Invalid token' } }));
      }

      if (method === 'tools/list') {
        return ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              { name: 'get_site_settings', description: 'Simulcast brand & site settings' },
              { name: 'list_services', description: 'Simulcast engineering services' },
              { name: 'list_projects', description: 'Simulcast real-world projects' },
              { name: 'submit_inquiry', description: 'Log a new customer inquiry' },
              { name: 'request_human_agent', description: 'Escalate to human support engineers' }
            ]
          }
        }));
      }

      if (method === 'ping') {
        return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: 'pong' }));
      }

      // Default echo / handler
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: { status: 'acknowledged', method, identity }
      }));
    } catch (err) {
      ws.send(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Invalid JSON payload' } }));
    }
  });

  ws.on('close', () => {
    console.log(`[WS Disconnect] ${identity}`);
  });
});
