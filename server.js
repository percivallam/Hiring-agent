
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 4173;
const DIST = path.join(__dirname, 'dist');

const mime = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  // API proxy
  if (req.url.startsWith('/api/deepseek')) {
    const targetPath = req.url.replace('/api/deepseek', '');
    const proxy = https.request({
      hostname: 'api.deepseek.com',
      path: targetPath,
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
    }, (pres) => {
      res.writeHead(pres.statusCode, pres.headers);
      pres.pipe(res);
    });
    proxy.on('error', (e) => { res.writeHead(502); res.end(e.message); });
    req.pipe(proxy);
    return;
  }

  // Static files
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log('http://localhost:' + PORT));
