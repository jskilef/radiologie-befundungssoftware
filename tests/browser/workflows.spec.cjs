'use strict';
const fs = require('node:fs/promises');
const {test: base, expect} = require('@playwright/test');
const {ORIGINAL, REVISED, reviewResult, completion, cpuRuntime} = require('./support.cjs');

const test = base.extend({
  networkGuard: [async ({context, page, baseURL}, use) => {
    const unexpected = [], errors = [];
    context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', async route => {
      const url = route.request().url();
      if (new URL(url).origin === baseURL) return route.continue();
      if (url === 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1') {
        return route.fulfill({contentType:'application/javascript', headers:{'Access-Control-Allow-Origin':'*'}, body:cpuRuntime});
      }
      unexpected.push(url);
      await route.abort();
    });
    await use();
    expect(unexpected, 'Tests must not download models or contact external services').toEqual([]);
    expect(errors, 'No unhandled browser errors').toEqual([]);
  }, {auto:true}]
});

async function configure(page, provider = 'compatible') {
  await page.goto('/');
  await page.getByRole('button', {name:'Configure API & templates', exact:true}).click();
  await page.getByLabel('Provider / API format', {exact:true}).selectOption(provider);
  if (provider === 'compatible') {
    await page.getByLabel('API endpoint', {exact:true}).fill('https://provider.invalid/v1/chat/completions');
    await page.getByLabel('Model ID', {exact:true}).fill('fixture-model');
  }
}

test('review, revise, diff and workspace clearing use the real page', async ({page}) => {
  await configure(page);
  await page.getByLabel('Original findings and impression').fill(ORIGINAL);
  await page.getByLabel('Check against the original before copying').fill('My manual draft.');
  await page.getByRole('button', {name:'Review', exact:true}).click();
  await expect(page.locator('#status')).toContainText('Review complete.');
  await expect(page.locator('#revision')).toHaveValue('My manual draft.');
  await expect(page.locator('#issues')).toContainText(reviewResult.issues[0].detail);
  await page.getByRole('button', {name:'Revise', exact:true}).click();
  await expect(page.locator('#revision')).toHaveValue(REVISED);
  await expect(page.locator('#diffPanel')).toBeVisible();
  await expect(page.locator('#diffBody ins')).toContainText('The');
  await expect(page.locator('#context')).toContainText('Generated');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name:'Clear workspace', exact:true}).click();
  await expect(page.locator('#source')).toHaveValue('');
  await expect(page.locator('#revision')).toHaveValue('');
  await expect(page.locator('#diffPanel')).toBeHidden();
  await expect(page.locator('#raw')).toBeEmpty();
});

test('outdated drafts require an export decision and keep keyboard focus', async ({page}) => {
  await configure(page);
  await page.locator('#source').fill(ORIGINAL);
  await page.getByRole('button', {name:'Revise', exact:true}).click();
  await expect(page.locator('#revision')).toHaveValue(REVISED);
  await page.locator('#source').fill(ORIGINAL + ' Additional synthetic text.');
  await expect(page.locator('#context')).toContainText('Inputs changed.');
  const downloads = [];
  page.on('download', download => downloads.push(download));
  await page.getByRole('button', {name:'Save report .txt', exact:true}).click();
  const dialog = page.getByRole('dialog', {name:'Export previous draft?'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', {name:'Keep editing'})).toBeFocused();
  await dialog.getByRole('button', {name:'Keep editing'}).click();
  await expect(dialog).toBeHidden();
  expect(downloads).toHaveLength(0);
  await page.getByRole('button', {name:'Save report .txt', exact:true}).click();
  const downloaded = page.waitForEvent('download');
  await dialog.getByRole('button', {name:'Save previous draft'}).click();
  const download = await downloaded;
  expect(await fs.readFile(await download.path(), 'utf8')).toBe(REVISED);
});

test('a late API response preserves edits made during generation', async ({page}) => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/api', async route => {
    await held;
    await route.fulfill({json:completion(JSON.stringify({...reviewResult, revised_report:REVISED}))});
  });
  try {
    await configure(page);
    await page.locator('#source').fill(ORIGINAL);
    const sent = page.waitForRequest(request => request.url().endsWith('/api'));
    await page.getByRole('button', {name:'Revise', exact:true}).click();
    await sent;
    await expect(page.getByRole('button', {name:'Cancel', exact:true})).toBeEnabled();
    await page.locator('#revision').fill('An edit made while waiting.');
    release();
    await expect(page.locator('#status')).toContainText('Draft changed during generation.');
    await expect(page.locator('#revision')).toHaveValue('An edit made while waiting.');
  } finally { release(); }
});

test('cancelling an API request preserves the previous draft and restores controls', async ({page}) => {
  await configure(page);
  await page.locator('#source').fill('SYNTHETIC_CANCEL');
  await page.locator('#revision').fill('Keep this existing draft.');
  const sent = page.waitForRequest(request => request.url().endsWith('/api'));
  await page.getByRole('button', {name:'Revise', exact:true}).click();
  await sent;
  await page.getByRole('button', {name:'Cancel', exact:true}).click();
  await expect(page.locator('#status')).toContainText('cancelled or timed out');
  await expect(page.locator('#revision')).toHaveValue('Keep this existing draft.');
  await expect(page.getByRole('button', {name:'Revise', exact:true})).toBeEnabled();
  await expect(page.getByRole('button', {name:'Cancel', exact:true})).toBeDisabled();
});

test('template drafts and provider credentials survive switching without mixing', async ({page}) => {
  await configure(page);
  await page.getByLabel('Template name', {exact:true}).fill('Synthetic template');
  await page.getByLabel('Structure / starter text', {exact:true}).fill('Synthetic findings:\n');
  await page.getByLabel('Select template', {exact:true}).selectOption('1');
  await page.getByLabel('Select template', {exact:true}).selectOption('0');
  await expect(page.locator('#templateName')).toHaveValue('Synthetic template');
  await expect(page.locator('#templateBody')).toHaveValue('Synthetic findings:\n');
  await page.getByLabel('Provider / API format', {exact:true}).selectOption('openai');
  await page.getByLabel('API key', {exact:true}).fill('synthetic-openai-key');
  await page.getByLabel('Model ID', {exact:true}).fill('synthetic-openai-model');
  await page.getByLabel('Provider / API format', {exact:true}).selectOption('gemini');
  await expect(page.locator('#key')).toHaveValue('');
  await page.getByLabel('API key', {exact:true}).fill('synthetic-gemini-key');
  await page.getByLabel('Provider / API format', {exact:true}).selectOption('openai');
  await expect(page.locator('#key')).toHaveValue('synthetic-openai-key');
  await expect(page.locator('#model')).toHaveValue('synthetic-openai-model');
  await page.getByLabel('API endpoint', {exact:true}).fill('https://different.invalid/v1/chat/completions');
  await expect(page.locator('#key')).toHaveValue('');
});

test('encrypted settings round-trip through browser files and reject a wrong password', async ({page, context}) => {
  await configure(page);
  await page.locator('#key').fill('synthetic-private-key');
  await page.locator('#source').fill(ORIGINAL);
  await page.locator('#revision').fill(REVISED);
  await page.getByLabel('Template name', {exact:true}).fill('Saved synthetic template');
  await page.getByRole('button', {name:'Save settings file', exact:true}).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Password', {exact:true}).fill('synthetic passphrase 1234');
  await dialog.getByLabel('Confirm password', {exact:true}).fill('synthetic passphrase 1234');
  const downloaded = page.waitForEvent('download');
  await dialog.getByRole('button', {name:'Continue', exact:true}).click();
  const download = await downloaded;
  const bytes = await fs.readFile(await download.path());
  for (const secret of [ORIGINAL, REVISED, 'synthetic-private-key', 'synthetic passphrase 1234']) expect(bytes.toString()).not.toContain(secret);
  expect(JSON.parse(bytes).format).toBe('report-studio-encrypted-settings');

  const fresh = await context.newPage();
  await fresh.goto('/');
  const file = {name:'synthetic-settings.encrypted.json', mimeType:'application/json', buffer:bytes};
  await fresh.locator('#load').setInputFiles(file);
  await fresh.getByRole('dialog').getByLabel('Password', {exact:true}).fill('incorrect passphrase');
  await fresh.getByRole('dialog').getByRole('button', {name:'Continue', exact:true}).click();
  await expect(fresh.locator('#status')).toContainText('Incorrect password or damaged settings file.');
  await expect(fresh.locator('#key')).toHaveValue('');
  await fresh.locator('#load').setInputFiles(file);
  await fresh.getByRole('dialog').getByLabel('Password', {exact:true}).fill('synthetic passphrase 1234');
  await fresh.getByRole('dialog').getByRole('button', {name:'Continue', exact:true}).click();
  await expect(fresh.locator('#status')).toContainText('Settings unlocked.');
  await expect(fresh.locator('#key')).toHaveValue('synthetic-private-key');
  await expect(fresh.locator('#templateName')).toHaveValue('Saved synthetic template');
  await expect(fresh.locator('#source')).toHaveValue('');
  await expect(fresh.locator('#revision')).toHaveValue('');
});

test('all themes, system changes, German labels and narrow layout work without losing text', async ({page, context}) => {
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#source').fill(ORIGINAL);
  await page.locator('#revision').fill(REVISED);
  for (const theme of ['light','dark','midnight','cobalt-light','cobalt-dark']) {
    await page.getByLabel('Appearance', {exact:true}).selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('#revision')).toHaveValue(REVISED);
    await expect(page.locator('#saved')).toHaveText('Settings remain in memory until saved.');
    expect(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme)).toBe(theme.endsWith('light') || theme === 'light' ? 'light' : 'dark');
  }
  await page.getByLabel('Interface language', {exact:true}).selectOption('de');
  await expect(page.getByLabel('Darstellung', {exact:true})).toHaveValue('cobalt-dark');
  await expect(page.locator('#themeSelect option:checked')).toHaveText('Kobalt Dunkel');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const fresh = await context.newPage();
  await fresh.goto('/');
  await expect(fresh.getByLabel('Appearance', {exact:true})).toHaveValue('cobalt-dark');
  await expect(fresh.locator('#source')).toHaveValue('');
  await expect(fresh.locator('#revision')).toHaveValue('');
});

const cpuModels = ['onnx-community/Qwen3-0.6B-ONNX', 'HuggingFaceTB/SmolLM2-135M-Instruct'];
for (const model of cpuModels) {
  for (const mode of ['Review','Revise']) {
    for (const invalid of ['CPU_PROSE','CPU_SCHEMA','CPU_TRUNCATED','CPU_NULL']) {
      test(`${model}: ${mode} rejects ${invalid} and preserves prior results`, async ({page}) => {
        await configure(page, 'wasm');
        await page.getByLabel('CPU model', {exact:true}).selectOption(model);
        await page.locator('#source').fill(ORIGINAL);
        await page.getByRole('button', {name:'Revise', exact:true}).click();
        await expect(page.locator('#revision')).toHaveValue(REVISED);
        const notes = await page.locator('#issues').textContent();
        await page.locator('#source').fill(`${ORIGINAL} ${invalid}`);
        await page.getByRole('button', {name:mode, exact:true}).click();
        await expect(page.locator('#status')).toContainText('CPU model did not return valid structured output');
        await expect(page.locator('#status')).toHaveClass('error');
        await expect(page.locator('#revision')).toHaveValue(REVISED);
        await expect(page.locator('#issues')).toHaveText(notes);
        await expect(page.locator('#rawBox')).toBeVisible();
        await page.locator('#rawBox summary').click();
        await expect(page.locator('#raw')).not.toBeEmpty();
        await expect(page.locator('#notesContext')).toContainText('latest action did not complete');
        await expect(page.getByRole('button', {name:'Revise', exact:true})).toBeEnabled();
        await expect(page.getByRole('button', {name:'Cancel', exact:true})).toBeDisabled();
        if (mode === 'Revise') {
          await page.getByRole('button', {name:'Save report .txt', exact:true}).click();
          await expect(page.getByRole('dialog', {name:'Export previous draft?'})).toBeVisible();
          await page.getByRole('button', {name:'Keep editing', exact:true}).click();
        }
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', {name:'Clear workspace', exact:true}).click();
        await expect(page.locator('#raw')).toBeEmpty();
        await expect(page.locator('#rawBox')).toBeHidden();
      });
    }
  }
}

test('CPU worker cancellation preserves edits and allows a fresh worker to recover', async ({page}) => {
  await configure(page, 'wasm');
  await page.locator('#source').fill('CPU_CANCEL');
  await page.locator('#revision').fill('Preserve this draft.');
  await page.getByRole('button', {name:'Revise', exact:true}).click();
  await expect(page.locator('#modelProgress')).toHaveText('Generating locally…');
  await page.getByRole('button', {name:'Cancel', exact:true}).click();
  await expect(page.locator('#status')).toContainText('cancelled or timed out');
  await expect(page.locator('#revision')).toHaveValue('Preserve this draft.');
  await page.locator('#source').fill(ORIGINAL);
  await page.getByRole('button', {name:'Revise', exact:true}).click();
  await expect(page.locator('#revision')).toHaveValue(REVISED);
});
