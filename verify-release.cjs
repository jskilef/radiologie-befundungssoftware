'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const version = read('VERSION').trim();
assert.match(version, /^\d+\.\d+\.\d+$/);
const license = read('LICENSE').trim();
assert.match(license, /^MIT License/);
assert.match(license, /Copyright \(c\) 2026 jskilef and Report Studio contributors/);
const html = read('report-studio.html');
assert(html.includes(`Report Studio · v${version}`));
assert(read('README.md').startsWith(`# Report Studio v${version}`));
assert(read('CHANGELOG.md').includes(`## ${version}`));
assert(read('release-notes.md').includes(`Report Studio v${version}`));
assert(html.includes(license), 'Standalone HTML must contain the complete project license.');
assert(html.includes('THIRD_PARTY_NOTICES.md'), 'Standalone HTML must link to third-party notices.');

const sources = JSON.parse(read('licenses/SOURCES.json'));
for (const source of sources.files) {
  assert.match(source.url, /^https:\/\//);
  assert.match(source.file, /^licenses\/[A-Za-z0-9._-]+\.txt$/);
  const bytes = fs.readFileSync(path.join(__dirname, source.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, `License hash: ${source.file}`);
  assert(!/^\s*</.test(bytes.toString()), `License must not be an HTML error page: ${source.file}`);
}
const files = JSON.parse(read('release-files.json'));
assert.equal(files.length, new Set(files).size);
for (const file of files) {
  assert(!/(^|\/)\.\.?($|\/)|\\|:|^\//.test(file), `Unsafe archive path: ${file}`);
  assert(fs.statSync(path.join(__dirname, file)).isFile(), `Missing release file: ${file}`);
  assert(!/\.codex|NATIVE_DESKTOP|encrypted\.json|revised-report/i.test(file), `Private/unrelated release file: ${file}`);
}
for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'licenses/SOURCES.json', 'report-studio.html',
  'local-server.cjs', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  ...sources.files.map(s => s.file)]) assert(files.includes(file), `Missing from package: ${file}`);
const example = JSON.parse(read('report-studio-settings.json').replace(/^\uFEFF/, ''));
assert.equal(example.apiKey, '');
assert.equal(example.model, '');
assert(!example.providerProfiles || Object.values(example.providerProfiles).every(p => !p.apiKey));
assert.equal(example.report, undefined);
assert.equal(example.revised_report, undefined);
console.log('PASS: release version consistency, complete standalone MIT license, upstream license hashes, explicit archive manifest and credential-free example.');
