const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const route = decodeURIComponent(url.pathname);
  const base = route.startsWith('/src/') ? root : route.startsWith('/images/') ? path.join(root,'public') : path.join(root,'.mobile-preview');
  const file = path.resolve(base, '.' + (route === '/' ? '/index.html' : route));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
if (require.main === module) server.listen(4321, '127.0.0.1', () => console.log('Mobile preview: http://127.0.0.1:4321/?home'));
module.exports = server;
