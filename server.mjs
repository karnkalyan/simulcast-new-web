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

import fs from 'fs';
import path from 'path';

let routesCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 10000;
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'custom-routes.json');

async function getCustomRoutes() {
  const now = Date.now();
  if (routesCache && now - lastCacheTime < CACHE_TTL) {
    return routesCache;
  }
  try {
    const list = await prisma.customRoute.findMany({ where: { enabled: true } });
    if (list && list.length > 0) {
      routesCache = list;
      lastCacheTime = now;
      return list;
    }
  } catch {}

  // Fallback to local json file
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        routesCache = list.filter(r => r.enabled !== false);
        lastCacheTime = now;
        return routesCache;
      }
    }
  } catch {}

  return routesCache || [];
}

const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    const pathname = (parsedUrl.pathname || '').trim().toLowerCase();

    // Check custom routes for non-internal paths
    if (
      pathname &&
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/api/admin') &&
      !pathname.startsWith('/api/auth') &&
      !pathname.startsWith('/api/chat') &&
      !pathname.startsWith('/api/mcp')
    ) {
      const routes = await getCustomRoutes();
      const matched = routes.find(r => {
        if (!r.enabled) return false;
        const rPath = (r.path || '').trim().toLowerCase();
        if (rPath !== pathname) return false;
        if (req.method === 'OPTIONS') return true;
        if (!r.method || r.method === 'ALL') return true;
        return r.method.toUpperCase() === req.method?.toUpperCase();
      });

      if (matched) {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          });
          res.end();
          return;
        }

        // Apply custom headers
        const headers = {
          'Content-Type': matched.contentType || 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        };

        if (matched.headers) {
          try {
            const extra = JSON.parse(matched.headers);
            if (extra && typeof extra === 'object') {
              for (const [k, v] of Object.entries(extra)) {
                if (v !== undefined && v !== null) headers[k] = String(v);
              }
            }
          } catch {}
        }

        res.writeHead(matched.statusCode || 200, headers);
        res.end(matched.responseBody || '');

        // Increment hit counter asynchronously
        prisma.customRoute.update({
          where: { id: matched.id },
          data: { hitCount: { increment: 1 }, lastHitAt: new Date() }
        }).catch(() => {});
        return;
      }
    }

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

      // Allow discovery and read-only tools without prior auth for ChatGPT and external clients
      const isPublicMethod = method === 'initialize' || method === 'tools/list' || method === 'ping';
      const isPublicTool = method === 'tools/call' && (params?.name === 'get_site_settings' || params?.name === 'list_services' || params?.name === 'list_projects');

      if (!authenticated && !isPublicMethod && !isPublicTool && method !== 'auth') {
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
        if (toolName === 'list_blog_posts') {
          const posts = await prisma.post.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 20 });
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(posts) }] } }));
        }
        if (toolName === 'create_blog_post') {
          const a = params?.arguments || {};
          const slug = String(a.slug || a.title || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
          const post = await prisma.post.upsert({
            where: { slug },
            update: { title: a.title, excerpt: a.excerpt, body: a.body, category: a.category || 'Insights', published: a.published !== false },
            create: { title: a.title, slug, excerpt: a.excerpt, body: a.body, category: a.category || 'Insights', published: a.published !== false }
          });
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Created blog post: ${post.title} at /insights/${post.slug}` }] } }));
        }
        if (toolName === 'update_blog_post') {
          const a = params?.arguments || {};
          const updated = await prisma.post.update({ where: { slug: a.slug }, data: { title: a.title, excerpt: a.excerpt, body: a.body, category: a.category } });
          return ws.send(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Updated blog post: ${updated.title}` }] } }));
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
