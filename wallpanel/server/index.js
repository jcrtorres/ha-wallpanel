// Servidor del add-on Wall Panel.
// - Sirve el frontend (React) compilado.
// - Guarda el tablero en /data/dashboard.json (persistente entre reinicios del add-on).
// - Hace de puente WebSocket hacia Home Assistant usando el token del Supervisor,
//   así el navegador de la tablet nunca necesita un token propio.
// - Proxy de imágenes de cámaras.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8099);
const DATA_DIR = process.env.DATA_DIR || '/data';
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, 'public');
const CONFIG_FILE = path.join(DATA_DIR, 'dashboard.json');

// Dentro del add-on: Supervisor. Fuera (desarrollo): HA_URL + HA_TOKEN. Sin nada: modo demo.
const SUP_TOKEN = process.env.SUPERVISOR_TOKEN;
const HA_HTTP = SUP_TOKEN ? 'http://supervisor/core' : process.env.HA_URL?.replace(/\/+$/, '');
const HA_TOKEN = SUP_TOKEN || process.env.HA_TOKEN;
const HA_WS = SUP_TOKEN ? 'ws://supervisor/core/websocket' : HA_HTTP && HA_HTTP.replace(/^http/, 'ws') + '/api/websocket';
const HA_API = SUP_TOKEN ? HA_HTTP + '/api' : HA_HTTP && HA_HTTP + '/api';
const MODE = HA_TOKEN && HA_HTTP ? 'ha' : 'demo';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const clients = new Set();

async function readBody(req, limit = 2_000_000) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw new Error('too large'); chunks.push(c); }
  return Buffer.concat(chunks).toString('utf8');
}
const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;

    if (p === '/api/info') return json(res, 200, { mode: MODE, version: process.env.ADDON_VERSION || 'dev' });

    if (p === '/api/config' && req.method === 'GET') {
      try { return json(res, 200, JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'))); }
      catch { return json(res, 200, null); }
    }
    if (p === '/api/config' && req.method === 'PUT') {
      const cfg = JSON.parse(await readBody(req));
      if (!cfg || !Array.isArray(cfg.sections)) return json(res, 400, { error: 'configuración inválida' });
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = CONFIG_FILE + '.tmp';
      await fs.writeFile(tmp, JSON.stringify(cfg, null, 2));
      await fs.rename(tmp, CONFIG_FILE);
      // avisa a las demás tablets para que recarguen el tablero
      const msg = JSON.stringify({ type: 'wallpanel/config_updated', updatedAt: cfg.updatedAt });
      clients.forEach((c) => c.readyState === WebSocket.OPEN && c.send(msg));
      return json(res, 200, { ok: true });
    }

    const cam = p.match(/^\/api\/camera\/(camera\.[a-z0-9_]+)$/);
    if (cam) {
      if (MODE !== 'ha') { res.writeHead(404); return res.end(); }
      const r = await fetch(`${HA_API}/camera_proxy/${cam[1]}`, { headers: { authorization: `Bearer ${HA_TOKEN}` } });
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'image/jpeg', 'cache-control': 'no-store' });
      return res.end(Buffer.from(await r.arrayBuffer()));
    }

    // Archivos estáticos con fallback a index.html
    const safe = path.normalize(decodeURIComponent(p)).replace(/^(\.\.[/\\])+/, '');
    let file = path.join(STATIC_DIR, safe);
    if (!file.startsWith(STATIC_DIR)) { res.writeHead(403); return res.end(); }
    try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
    catch { file = path.join(STATIC_DIR, 'index.html'); }
    const data = await fs.readFile(file);
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' });
    res.end(data);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: String(e.message || e) });
  }
});

// ---------- Puente WebSocket ----------
// El navegador habla el protocolo normal de HA (mensajes con id), pero sin la fase de auth:
// el servidor se autentica con el token del Supervisor y luego reenvía todo en ambos sentidos.
const wss = new WebSocketServer({ server, path: undefined });
wss.on('connection', (client, req) => {
  if (!new URL(req.url, 'http://x').pathname.endsWith('/ws')) return client.close();
  clients.add(client);
  client.on('close', () => clients.delete(client));

  if (MODE !== 'ha') { client.send(JSON.stringify({ type: 'wallpanel/ready', mode: 'demo' })); return; }

  const up = new WebSocket(HA_WS);
  const queue = [];
  let ready = false;
  up.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'auth_required') return up.send(JSON.stringify({ type: 'auth', access_token: HA_TOKEN }));
    if (msg.type === 'auth_invalid') { client.send(JSON.stringify({ type: 'wallpanel/error', message: 'Token del Supervisor rechazado' })); return client.close(); }
    if (msg.type === 'auth_ok') {
      ready = true; queue.splice(0).forEach((m) => up.send(m));
      return client.send(JSON.stringify({ type: 'wallpanel/ready', mode: 'ha', ha_version: msg.ha_version }));
    }
    if (client.readyState === WebSocket.OPEN) client.send(raw.toString());
  });
  up.on('close', () => client.close());
  up.on('error', (e) => { console.error('upstream', e.message); client.close(); });
  client.on('message', (raw) => {
    const m = raw.toString();
    try { if (JSON.parse(m).type === 'auth') return; } catch { return; }
    ready ? up.send(m) : queue.push(m);
  });
  client.on('close', () => up.close());
});

server.listen(PORT, () => console.log(`[wallpanel] escuchando en :${PORT} · modo ${MODE}`));
