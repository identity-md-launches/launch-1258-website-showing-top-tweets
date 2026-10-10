import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain' };
export async function startPreview(port = 0) {
  const root = resolve('dist');
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/preview') { response.writeHead(301, { Location: '/preview/' }).end(); return; }
    if (!pathname.startsWith('/preview/')) { response.writeHead(404).end('Not found'); return; }
    try {
      const path = resolve(root, decodeURIComponent(pathname.slice('/preview/'.length)) || 'index.html');
      if (!path.startsWith(root + sep)) { response.writeHead(403).end('Forbidden'); return; }
      const body = await readFile(path);
      response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(body);
    } catch { response.writeHead(404).end('Not found'); }
  });
  await new Promise(done => server.listen(port, '0.0.0.0', done));
  return { server, url: `http://localhost:${server.address().port}/preview/` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server, url } = await startPreview(Number(process.argv[2] || 4173));
  console.log(`Serving only dist at ${url}`);
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  // Bounded inspection session; the interaction validator manages its own server.
  setTimeout(stop, 20 * 60 * 1000).unref();
}
