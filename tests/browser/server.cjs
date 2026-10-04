'use strict';
// The real loopback launcher with a synthetic upstream. Never connects to a provider.
const {createServer} = require('../../local-server.cjs');
const {setTimeout: delay} = require('node:timers/promises');
const {ORIGINAL, REVISED, reviewResult, completion} = require('./support.cjs');

const server = createServer({upstreamFetch: async (url, options) => {
  if (url !== 'https://provider.invalid/v1/chat/completions') throw Error('Unexpected fixture endpoint');
  const body = JSON.parse(options.body);
  const input = JSON.parse(body.messages.at(-1).content);
  if (input.report === 'SYNTHETIC_CANCEL') await delay(60_000, undefined, {signal: options.signal});
  if (input.report !== ORIGINAL && input.report !== 'SYNTHETIC_CANCEL') throw Error('Unexpected fixture report');
  const review = body.messages[0].content.includes('Review only. Do not rewrite the report.');
  return new Response(JSON.stringify(completion(JSON.stringify(review ? reviewResult : {...reviewResult, revised_report: REVISED}))), {
    headers: {'Content-Type': 'application/json'}
  });
}});
server.listen(Number(process.env.REPORT_STUDIO_TEST_PORT || 4173), '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close();
  server.closeAllConnections();
});
