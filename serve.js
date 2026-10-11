/**
 * SAMS - Zero-Dependency Local Static Server
 * Serves the Student Attendance Management System locally.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Parse clean URL path
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Default to index.html for root path
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Safe file path resolution
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safeSuffix);

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found | SAMS</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>404 - File Not Found</h2>
          <p>The requested file <code>${pathname}</code> was not found.</p>
          <a href="/index.html">Return to SAMS Portal</a>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('========================================================');
  console.log('STUDENT ATTENDANCE MANAGEMENT SYSTEM (SAMS)');
  console.log('========================================================');
  console.log(`Local Server: http://localhost:${PORT}`);
  console.log(`Login Portal: http://localhost:${PORT}/index.html`);
  console.log('Camera QR scanning is fully supported on localhost.');
  console.log('Press Ctrl+C to stop the server.');
  console.log('========================================================\n');
});
