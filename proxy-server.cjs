const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_TARGET = 'ark.cn-beijing.volces.com';
const STATIC_DIR = path.join(__dirname, 'dist');
const PORT = 3456;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Proxy: /api/proxy/* -> https://ark.cn-beijing.volces.com/*
  if (req.url.startsWith('/api/proxy')) {
    const targetPath = req.url.replace('/api/proxy', '');
    console.log(`[Proxy] ${req.method} ${targetPath}`);

    const proxyReq = https.request({
      hostname: API_TARGET,
      path: targetPath,
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'],
        'host': API_TARGET,
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[Proxy Error]', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
    });

    req.pipe(proxyReq);
    return;
  }

  // Static files
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(STATIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files: ${STATIC_DIR}`);
  console.log(`🔀 API Proxy: /api/proxy -> https://${API_TARGET}`);
});
