import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const prisma = new PrismaClient();
const MASTER_KEY = process.env.MCP_API_KEY || 'simulcast_master_mcp_api_key_2026_sec';
const ADMIN_KEY = process.env.ADMIN_KEY || 'simulcast-admin';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// Create WebSocket server attached to the SAME HTTP SERVER (no different port!)
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const { pathname } = parse(req.url || '/', true);

  // Accept WebSocket upgrades on /api/ws, /ws, and /api/mcp/ws on the SAME PORT
  if (pathname === '/api/ws' || pathname === '/ws' || pathname === '/api/mcp/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    // If not a recognized WS route, close socket
    socket.destroy();
  }
});

wss.on('connection', async (ws, req) => {
  const url = parse(req.url || '/', true);
  const token = url.query?.token || req.headers['sec-websocket-protocol'] || '';

  let authenticated = token === MASTER_KEY || (ADMIN_KEY && token === ADMIN_KEY);
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
      console.error('[WS Auth Error]', err);
    }
  }

  console.log(`[Same-Port WebSocket Connected] Identity: ${identity}, Auth: ${authenticated}`);

  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'simulcast/connected',
    params: {
      server: 'Simulcast MCP & Live WebSocket Server',
      port,
      samePort: true,
      version: '1.0.0',
      authenticated,
      identity,
      endpoint: '/api/ws'
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
          error: { code: -32002, message: 'Unauthorized. Please authenticate first via method: "auth"' }
        }));
      }

      if (method === 'auth') {
        const checkToken = params?.token;
        if (checkToken === MASTER_KEY || (ADMIN_KEY && checkToken === ADMIN_KEY)) {
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

      if (method === 'tools/call') {
        const toolName = params?.name;
        if (toolName === 'get_site_settings') {
          const s = await prisma.siteSettings.findFirst();
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(s) }] } }));
        }
        if (toolName === 'list_services') {
          const s = await prisma.service.findMany({ where: { published: true } });
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(s) }] } }));
        }
        if (toolName === 'list_projects') {
          const p = await prisma.project.findMany({ where: { published: true } });
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(p) }] } }));
        }
      }

      if (method === 'ping') {
        return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: 'pong' }));
      }

      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: { status: 'acknowledged', method, identity }
      }));
    } catch {
      ws.send(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Invalid JSON payload' } }));
    }
  });

  ws.on('close', () => {
    console.log(`[Same-Port WebSocket Disconnected] ${identity}`);
  });
});

server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port} and ws://localhost:${port}/api/ws (Unified Single Port)`);
});
