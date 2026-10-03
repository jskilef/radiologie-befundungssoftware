'use strict';
// Synthetic reports only. Exercises production script with event-aware DOM doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const script = fs.readFileSync('report-studio.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

function boot() {
  const elements = {}, copies = [], downloads = [], confirmations = [];
  let confirmation = true, autoConfirmExport = true;
  const defaults = {
    provider: 'openai', uiLanguage: 'en', language: 'Same as original',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    browserModel: 'Qwen3-0.6B-q4f16_1-MLC', cpuModel: 'onnx-community/Qwen3-0.6B-ONNX'
  };
  function element(tagName = 'DIV') {
    return {
      tagName: tagName.toUpperCase(), value: '', textContent: '', children: [], className: '', listeners: {},
      replaceChildren(...children) { this.children = children; },
      append(...children) { this.children.push(...children); },
      showModal() { this.open = true; if (this === elements.staleExportDialog && autoConfirmExport) Promise.resolve().then(() => elements[confirmation ? 'staleExportConfirm' : 'staleExportCancel'].onclick()); },
      close() { this.open = false; },
      addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
      async dispatch(type) { for (const fn of this.listeners[type] || []) await fn({target: this}); await this['on' + type]?.({target: this}); },
      focus() {}, select() {}, click() {}, setAttribute() {}
    };
  }
  const context = {
    crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, btoa, atob,
    location: {protocol: 'file:', hostname: ''},
    document: {
      getElementById(id) { if (!elements[id]) { elements[id] = element(); elements[id].value = defaults[id] || ''; } return elements[id]; },
      createElement: element, createTextNode: text => ({textContent: text})
    },
    window: {addEventListener() {}}, URL, Blob, AbortController, setTimeout, clearTimeout, console,
    confirm: message => { confirmations.push(message); return confirmation; },
    navigator: {clipboard: {writeText: async text => copies.push(text)}},
    fetch: async () => response('No right pleural effusion. Lesion measures 5 mm.')
  };
  vm.createContext(context);
  const run = code => vm.runInContext(code, context);
  run(script);
  context.captureDownload = (name, text) => downloads.push({name, text});
  run('saveFile=captureDownload');
  const set = async (id, value, type = 'input') => { elements[id].value = value; await elements[id].dispatch(type); };
  return {elements, context, run, set, copies, downloads, confirmations, confirm(value) { confirmation = value; }, manualExportDialog() { autoConfirmExport = false; }};
}
function response(revised_report) {
  return {ok: true, json: async () => ({choices: [{finish_reason: 'stop', message: {content: JSON.stringify({
    revised_report, issues: [{category: 'Measurement', detail: 'Check 5 mm against the original.'}], changes: ['Synthetic edit.']
  })}}]})};
}
async function ready(app) {
  await app.set('key', 'synthetic-openai-key');
  await app.set('model', 'test-model');
  await app.set('source', 'No left pleural effusion. Lesion measures 3 mm.');
}

(async () => {
  // Separate profiles: new providers start without another provider's secrets.
  const a = boot(); await ready(a);
  await a.set('provider', 'gemini', 'change');
  assert.equal(a.elements.key.value, ''); assert.equal(a.elements.model.value, '');
  await a.set('key', 'synthetic-gemini-key'); await a.set('model', 'gemini-test-model');
  await a.set('provider', 'openai', 'change');
  assert.equal(a.elements.key.value, 'synthetic-openai-key'); assert.equal(a.elements.model.value, 'test-model');
  await a.set('endpoint', 'https://api.openai.com/v1/other');
  assert.equal(a.elements.key.value, 'synthetic-openai-key', 'same origin retains the key');
  await a.set('endpoint', 'https://another.example/v1/chat/completions');
  assert.equal(a.elements.key.value, '', 'a different origin clears the key');
  assert.match(a.elements.destination.textContent, /https:\/\/another\.example/);
  await a.set('provider', 'gemini', 'change'); assert.equal(a.elements.key.value, 'synthetic-gemini-key');
  await a.set('provider', 'wasm', 'change'); assert.equal(a.elements.key.value, '');
  assert.match(a.elements.destination.textContent, /on this device/);
  await a.set('provider', 'compatible', 'change'); assert.equal(a.elements.endpoint.value, ''); assert.equal(a.elements.key.value, '');
  assert.match(a.elements.destination.textContent, /valid endpoint/);
  await a.set('endpoint', 'http://127.0.0.1:1234/v1/chat/completions');
  await a.set('model', 'local-test-model');
  const settings = JSON.parse(a.run('JSON.stringify(validate(config()))'));
  assert.equal(settings.providerProfiles.gemini.apiKey, 'synthetic-gemini-key');
  a.context.savedSettings = settings;
  const encrypted = await a.run("encryptSettings(savedSettings,'synthetic passphrase 1234')");
  assert(!JSON.stringify(encrypted).includes('synthetic-gemini-key'));
  const b = boot(); b.context.encrypted = encrypted;
  const decoded = await b.run("decryptSettings(encrypted,'synthetic passphrase 1234')");
  b.elements.load.files = [{size: 1000, text: async () => JSON.stringify(decoded)}];
  await b.elements.load.onchange({target: b.elements.load});
  await b.set('provider', 'gemini', 'change');
  assert.equal(b.elements.key.value, 'synthetic-gemini-key'); assert.equal(b.elements.model.value, 'gemini-test-model');
  assert.throws(() => b.run("validate({...config(),providerProfiles:{unknown:{endpoint:'',apiKey:'x',model:'x'}}})"), /Invalid provider/);
  assert.throws(() => b.run("validate({...config(),providerProfiles:{openai:{endpoint:'http://external.example',apiKey:'x',model:'x'}}})"), /HTTPS/);

  // Switching/new templates preserves even unfinished edits; saving still validates names.
  const t = boot();
  await t.set('templateName', 'Edited first'); await t.set('templateBody', 'Retained body');
  await t.set('templates', '1', 'change'); await t.set('templateBody', 'Retained second');
  await t.set('templates', '0', 'change'); assert.equal(t.elements.templateBody.value, 'Retained body');
  assert.equal(t.elements.templateName.value, 'Edited first');
  await t.set('templateName', ''); await t.set('templates', '1', 'change');
  assert.equal(t.elements.templateBody.value, 'Retained second');
  await t.set('templates', '0', 'change'); assert.equal(t.elements.templateName.value, '');
  assert.throws(() => t.run('validate(config())'), /Invalid settings/);
  await t.set('templateName', 'Restored'); await t.set('templateBody', 'Keep on new');
  t.elements.new.onclick(); await t.set('templates', '0', 'change'); assert.equal(t.elements.templateBody.value, 'Keep on new');
  t.confirm(false); const oldBody = t.elements.templateBody.value;
  t.elements.load.files = [{size: 100, text: async () => JSON.stringify(settings)}];
  await t.elements.load.onchange({target: t.elements.load}); assert.equal(t.elements.templateBody.value, oldBody);

  // Exact diff round trips, Unicode, untrusted markup and a bounded large-input fallback.
  const d = boot();
  for (const [before, after] of [
    ['', 'text'], ['text', ''], ['same', 'same'], ['No left 3.5 mm.\n', 'No right 5,5 cm.\n'],
    ['Kein Ödem — Größe 2 mm. 👁', 'Ödem — Größe 3 mm. 👁'], ['<script>secret</script>', '<img src=x onerror=bad>']
  ]) {
    d.context.before = before; d.context.after = after;
    const {parts} = d.run('textDiff(before,after)');
    assert.equal(parts.filter(p => p.kind !== 'insert').map(p => p.text).join(''), before);
    assert.equal(parts.filter(p => p.kind !== 'delete').map(p => p.text).join(''), after);
  }
  // Deterministic varied inputs catch repeated-token and boundary errors without snapshotting implementation.
  let seed = 173;
  const word = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return ['left', 'right', 'no', '5', 'Ödem', '\n', ' '][seed % 7]; };
  for (let i = 0; i < 100; i++) {
    d.context.before = Array.from({length: 30}, word).join(''); d.context.after = Array.from({length: 30}, word).join('');
    const {parts} = d.run('textDiff(before,after)');
    assert.equal(parts.filter(p => p.kind !== 'insert').map(p => p.text).join(''), d.context.before);
    assert.equal(parts.filter(p => p.kind !== 'delete').map(p => p.text).join(''), d.context.after);
  }
  d.context.before = 'left '.repeat(1500); d.context.after = 'right\n'.repeat(1500);
  assert.equal(d.run('textDiff(before,after).coarse'), true);
  await d.set('revision', '<img src=x onerror=bad>');
  assert(d.elements.diffBody.children.every(el => ['INS', 'DEL', 'SPAN'].includes(el.tagName)));
  assert.equal(d.run("hasSensitiveWording('keine rechts 3,5')"), true);
  assert.equal(d.run("hasSensitiveWording('rechtsseitiger')"), true);
  assert.equal(d.run("hasSensitiveWording('cm')"), true);
  await d.set('uiLanguage', 'de', 'change'); assert.match(d.elements.diffBasis.textContent, /Vergleich/);

  // Review and revision have independent provenance; only their own prompts invalidate them.
  const w = boot(); await ready(w); await w.elements.revise.onclick();
  assert.equal(w.elements.diffPanel.hidden, false); assert.equal(w.elements.copy.disabled, false);
  assert.equal(w.run('resultIsStale(revisionResult)'), false);
  assert(w.elements.diffBody.children.some(el => el.tagName === 'DEL' && /left/.test(el.textContent)));
  assert(w.elements.diffBody.children.some(el => el.tagName === 'INS' && /right/.test(el.textContent)));
  await w.set('source', 'Changed original.');
  assert.match(w.elements.context.textContent, /Inputs changed/); assert.match(w.elements.notesContext.textContent, /Inputs changed/);
  assert(w.elements.diffBody.children.some(el => /left/.test(el.textContent)), 'diff retains the submitted original');
  w.confirm(false); await w.elements.copy.onclick(); await w.elements.download.onclick();
  assert.equal(w.copies.length, 0); assert.equal(w.downloads.length, 0);
  w.confirm(true); await w.elements.copy.onclick(); assert.equal(w.copies.length, 1);
  await w.set('source', 'No left pleural effusion. Lesion measures 3 mm.');
  await w.set('reviewPrompt', 'Review with this separate prompt.');
  assert.equal(w.run('resultIsStale(revisionResult)'), false);
  await w.elements.review.onclick();
  await w.set('revisePrompt', 'Changed revision prompt.');
  assert.equal(w.run('resultIsStale(revisionResult)'), true); assert.equal(w.run('resultIsStale(notesResult)'), false);
  await w.set('templateBody', 'New structure'); assert.equal(w.run('resultIsStale(notesResult)'), true);
  await w.elements.revise.onclick(); await w.set('revision', 'Manually edited draft.');
  assert.match(w.elements.notesContext.textContent, /Draft edited/); assert.match(w.elements.context.textContent, /Edited after generation/);

  // Edits while generation is in flight must never be overwritten by a delayed response.
  let release;
  w.context.fetch = () => new Promise(resolve => { release = resolve; });
  const pending = w.elements.revise.onclick();
  await w.set('revision', 'Keep these edits made during generation.');
  release(response('Do not overwrite manual edits.')); await pending;
  assert.equal(w.elements.revision.value, 'Keep these edits made during generation.');
  assert.match(w.elements.status.textContent, /Your edits were kept/);
  w.confirm(false); await w.elements.copy.onclick(); assert.equal(w.copies.length, 1);
  const reviewPending = w.elements.review.onclick(); await w.set('language', 'German');
  release(response('Unused by review.')); await reviewPending;
  assert.match(w.elements.notesContext.textContent, /Inputs changed/);
  assert.equal(w.elements.revision.value, 'Keep these edits made during generation.');

  // Malformed responses retain the last notes/draft and explicitly mark the failed attempt.
  const oldNotes = w.elements.issues.children;
  w.context.fetch = async () => ({ok: true, json: async () => ({choices: [{message: {content: 'not json'}}]})});
  await w.elements.revise.onclick();
  assert.equal(w.elements.issues.children, oldNotes); assert.match(w.elements.notesContext.textContent, /latest action did not complete/);
  assert.equal(w.elements.raw.textContent, 'not json');
  w.manualExportDialog();
  const delayedCopy = w.elements.copy.onclick();
  await w.set('revision', 'Changed while confirming.');
  w.elements.staleExportConfirm.onclick(); await delayedCopy;
  assert.equal(w.copies.length, 1); assert.match(w.elements.status.textContent, /changed while confirming/);
  w.confirm(true); w.elements.clear.onclick();
  assert.equal(w.elements.notesContext.textContent, ''); assert.equal(w.elements.context.textContent, '');
  assert.equal(w.elements.diffPanel.hidden, true); assert.equal(w.elements.diffBody.children.length, 0);
  assert.equal(w.run('revisionResult'), null); assert.equal(w.run('notesResult'), null);
  assert.equal(w.elements.copy.disabled, true); assert.equal(w.elements.raw.textContent, '');
  console.log('PASS: provider credential isolation and encrypted profile round-trip, endpoint changes, template preservation, exact bounded diff, safe text rendering, result provenance, stale-export decisions, in-flight edits, failed-result retention and clearing.');
})().catch(error => { console.error(error); process.exitCode = 1; });
