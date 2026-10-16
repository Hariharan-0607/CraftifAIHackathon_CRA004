/**
 * Workplace Safety Sentinel - Node.js Server & HTTP/WebSocket Bridge
 * Serves dashboard files and relays live DeepStream MQTT/Socket events.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DASHBOARD_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  // API endpoint: append incident log
  if (reqUrl === '/api/alert' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const alert = JSON.parse(body);
        const logEntry = JSON.stringify(alert) + '\n';
        fs.appendFileSync(path.join(__dirname, '../incidents.jsonl'), logEntry);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', received: alert.event_id }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: read incidents
  if (reqUrl === '/api/incidents' && req.method === 'GET') {
    const logPath = path.join(__dirname, '../incidents.jsonl');
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
      const incidents = lines.map(line => {
        try { return JSON.parse(line); } catch (e) { return null; }
      }).filter(Boolean);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(incidents));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
    }
    return;
  }

  // Static file serving
  const filePath = path.join(DASHBOARD_DIR, reqUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`File not found: ${reqUrl}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('================================================================');
  console.log(` SENTINEL-AI Operations Dashboard live on http://localhost:${PORT}`);
  console.log(` Ready for hackathon presentation and live judges demonstration!`);
  console.log('================================================================');
});
