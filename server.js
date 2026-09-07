/* ------------------------------------------------------------------
   server.js — a tiny static file server for the Mubby Studio site.
   No dependencies, no npm install. Run:  node server.js
   Then open http://localhost:5173
------------------------------------------------------------------ */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.txt':  'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const file = path.join(ROOT, path.normalize(urlPath));
  if (!file.startsWith(ROOT)) {            // no climbing out of /site
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1 style="font:300 2rem Georgia,serif;padding:3rem">404 — no such frame</h1>');
      console.log(`404  ${urlPath}`);
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const long = ['.jpg', '.jpeg', '.png', '.webp', '.woff2', '.woff'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': long ? 'public, max-age=86400' : 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Mubby Studio — running locally');
  console.log('  ────────────────────────────────');
  console.log(`  http://localhost:${PORT}`);
  console.log('  Ctrl+C to stop');
  console.log('');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is busy. Try:  set PORT=5174 && node server.js`);
    process.exit(1);
  }
  throw err;
});
