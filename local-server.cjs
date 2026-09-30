'use strict';
// Optional loopback-only launcher. No dependencies; requires Node.js 18+.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {randomBytes, timingSafeEqual} = require('node:crypto');

function createServer({upstreamFetch = fetch} = {}) {
  const token = randomBytes(32).toString('hex');
  const server = http.createServer(async (req, res) => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    function reply(code, data) { res.writeHead(code, {'Content-Type':'application/json'});res.end(JSON.stringify(data)); }
    if (req.headers.host !== new URL(origin).host) return reply(403, {error:'Invalid host'});
    if (req.method === 'GET' && req.url === '/') {
      const source = fs.readFileSync(path.join(__dirname, 'report-studio.html'), 'utf8');
      res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
      return res.end(source.replace("'use strict';", `'use strict';\nconst LOCAL_TOKEN=${JSON.stringify(token)};`));
    }
    if (req.method !== 'POST' || req.url !== '/api') return reply(404, {error:'Not found'});
    const incomingToken = req.headers['x-local-token'];
    if (req.headers.origin !== origin || typeof incomingToken !== 'string' || Buffer.byteLength(incomingToken) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(incomingToken), Buffer.from(token))) return reply(403, {error:'Invalid origin or session'});
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, {error:'JSON required'});
    let size = 0, chunks = [];
    try {
      for await (const chunk of req) { size += chunk.length;if(size > 2e6) {reply(413, {error:'Request too large'});return;}chunks.push(chunk); }
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const url = new URL(input.url);
      const loopback = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
      if (url.username || url.password || url.search || url.hash || !(url.protocol === 'https:' || (url.protocol === 'http:' && loopback))) return reply(400, {error:'Invalid endpoint'});
      if (!input.body || typeof input.body !== 'object' || !input.headers || typeof input.headers !== 'object') return reply(400, {error:'Invalid request'});
      const headers = {'Content-Type':'application/json'};
      for (const name of ['Authorization','x-goog-api-key']) {
        if (input.headers[name] !== undefined) {
          if (typeof input.headers[name] !== 'string' || /[\r\n]/.test(input.headers[name])) return reply(400, {error:'Invalid headers'});
          headers[name] = input.headers[name];
        }
      }
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 180000);
      res.on('close', () => { if (!res.writableEnded) abort.abort(); });
      try {
        const upstream = await upstreamFetch(url.href, {method:'POST', redirect:'error', headers, body:JSON.stringify(input.body), signal:abort.signal});
        // Relay only recognised diagnostic codes; error messages may echo keys or report text.
        if (!upstream.ok) {
          const retryAfter = upstream.headers?.get('Retry-After');
          if (retryAfter && /^\d{1,6}$/.test(retryAfter)) res.setHeader('Retry-After', retryAfter);
          const failure = await upstream.json().catch(() => null);
          const candidate = failure?.code ?? failure?.error?.code;
          const code = ['tier_not_allowed','rate_limit_exceeded','quota_exceeded','insufficient_quota','model_not_allowed','invalid_api_key','permission_denied','1300'].includes(candidate) ? candidate : undefined;
          return reply(upstream.status, {error:'Provider rejected request', ...(code ? {code} : {})});
        }
        const data = await upstream.json();
        reply(200, data);
      } catch { reply(502, {error:'Unable to reach provider'}); }
      finally { clearTimeout(timer); }
    } catch { if(!res.headersSent)reply(400, {error:'Invalid JSON request'}); }
  });
  return server;
}
if (require.main === module) {
  const server = createServer();
  server.listen(0, '127.0.0.1', () => console.log(`Report Studio: http://127.0.0.1:${server.address().port}\nOpen this URL in your browser. Keep this terminal running. Ctrl+C stops the launcher.`));
}
module.exports = {createServer};
