# Report Studio v1.4.0

A browser workspace for reviewing and editing radiology report drafts. Use your own API provider or run a supported model on your device, with English and German interfaces, reusable templates, and an editable comparison of the original and revised text.

[Download a release](https://github.com/jskilef/radiologie-befundungssoftware/releases) · [Changelog](CHANGELOG.md) · [Report an issue](https://github.com/jskilef/radiologie-befundungssoftware/issues) · [MIT license](LICENSE)

## Get started

1. Download and extract the complete ZIP from **Releases**, or use a checkout of this repository.
2. Open `report-studio.html` in a current browser.
3. Choose **Configure API & templates**, select a provider, and enter its connection details or choose a browser model.
4. Click **Test connection**, then paste a report and choose **Review** or **Revise**.

The complete ZIP includes the launcher, app icons, documentation, and license files. A separate standalone HTML download is also available. Release downloads represent the tagged version; this README describes the current repository, including changes listed under **Unreleased** in the changelog.

### Optional local launcher

If browser restrictions prevent an API connection or a local model from loading, run the launcher with Node.js 18 or newer:

```sh
node local-server.cjs
```

Open [http://127.0.0.1:8787](http://127.0.0.1:8787) and keep the terminal running. Stop it with **Ctrl+C**. Set `REPORT_STUDIO_PORT` to use another port.

The launcher serves the interface and forwards API requests, avoiding provider CORS restrictions. It listens only on the local machine, validates requests, and does not log or save reports or keys. Browser model inference still runs in the browser.

## Choose how to process reports

| Mode | Setup | Where inference runs |
| --- | --- | --- |
| OpenAI | API key, model ID, and `https://api.openai.com/v1/chat/completions` | Your configured API endpoint |
| Google Gemini | API key, model ID, and `https://generativelanguage.googleapis.com/v1beta/models` | Google Gemini |
| Other OpenAI-compatible API | Full Chat Completions URL and model ID; key if required | Your chosen service or local server |
| Browser local · WebLLM | Choose Qwen3 0.6B, 1.7B, or 4B; requires WebGPU | This device, using its GPU |
| Browser local · CPU | Choose Qwen3 0.6B or SmolLM2 135M; requires WebAssembly | This device, using its CPU |

Each API provider has a separate connection profile. Switching providers restores its endpoint, key, and model. Changing the endpoint's origin clears the current key. The report destination appears beside the report actions. **Test connection** sends a small test prompt rather than your report; API providers may charge for it.

Other API formats require a compatible gateway. The app never automatically switches providers or falls back to cloud inference.

### Browser models

First use downloads runtime and model assets from external hosts, including jsDelivr, GitHub, and Hugging Face. These files may be cached for later use. Downloads need network access even though inference runs locally.

- **WebLLM:** Qwen3 models use 4-bit weights with a default 4,096-token context shared by instructions, templates, report text, and output. Start with the smallest model if GPU memory is limited. The runtime is pinned to WebLLM 0.2.85 and requests constrained JSON output.
- **CPU:** Transformers.js 3.8.1 uses ONNX Runtime WebAssembly with q8 weights. Inputs above 2,048 tokens are rejected, and output is capped at 1,024 new tokens. Loading and generation can be slow. These small models can fail to follow the required JSON format; SmolLM2 135M is an English-focused test option. Malformed output is rejected, the previous draft is preserved, and the raw response remains available for inspection. A successful model load does not establish reliable report generation.

**Cancel**, **Unload browser model**, and **Clear workspace** release the local worker and its model memory. Cached model files can remain in the browser. Local requests time out after 20 minutes.

See [local inference alternatives](LOCAL_MODEL_OPTIONS.md) for researched model and runtime candidates. Those candidates are not integrated or benchmarked in this project.

## Review and revise

**Review** produces notes about possible inconsistencies without changing the draft. **Revise** produces an editable report and review notes. Both use your original text and selected template.

**Changes in draft** shows additions and deletions. Amber outlines highlight changes involving numbers, units, sides, negation, or uncertainty. Check every change against the original; the highlighting is a text aid and can miss clinically important edits.

Results retain the inputs used to produce them. Later input changes mark affected results as outdated. Manual draft edits are preserved, including edits made while generation is running. Copying or saving an outdated draft requires confirmation.

Use **Copy revision** or **Save report .txt** after reviewing the result. **Clear workspace** removes report text, results, and comparison content. Closing or reloading the page clears unsaved work.

## Templates and prompts

Create and edit templates under **Configure API & templates**. Each template has a name, starter structure, and style instructions. Edits stay in memory when switching templates; save your settings to keep them for another session.

**Advanced settings** contains separate prompts for Review and Revise. The app adds the required response format and review-note language. Each prompt must contain 1–20,000 characters, and each has a reset button.

Interface language and report language are independent. Choose English or Deutsch in the toolbar, and select the report language in the connection settings.

## Appearance

Choose **System**, **Studio Light**, **Slate Dark**, **Midnight**, **Cobalt Light**, or **Cobalt Dark** in the header. Cobalt pairs deep blue with orange accents. System follows your operating system's light or dark preference, including changes while the app is open.

The appearance preference is remembered in this browser, independently of settings files. Theme switching preserves report text and pending requests. If browser storage is unavailable, your choice lasts for the current tab.

## Save and load settings

**Save settings file** downloads `report-studio-settings.encrypted.json`. Choose a password of at least 12 characters. The file includes provider profiles, API keys, models, templates, prompts, and language preferences. Reports and generated results are excluded.

**Load settings** asks for the file's password and replaces the current configuration after confirmation if there are unsaved settings. An incorrect password or damaged file leaves the current settings untouched. Keep your password somewhere secure; there is no password recovery.

Settings are encrypted locally with AES-256-GCM. PBKDF2-SHA256 uses 600,000 iterations to derive the key, with a fresh salt and IV for each export. Passwords are never saved or sent to a provider. Once unlocked, settings remain in tab memory until the page closes or reloads.

Older plaintext settings files can still be imported and re-exported as encrypted files. The included `report-studio-settings.json` is a blank legacy example with no API key or model configured.

## Data handling

API modes send the report and selected template to the configured endpoint. Browser modes pass them to a local worker. The app has no analytics or automatic report saving; only the appearance preference is stored locally, and runtime/model assets may be cached.

Use de-identified text and an institution-approved service for sensitive information. AI suggestions require clinical review; clinical accuracy and legal compliance have not been certified. Keep settings files private, and omit patient text, keys, and private settings from issue reports.

## Save as a browser app

Open Report Studio over HTTPS or through the local launcher, then choose **Save as app**. If an installation prompt is unavailable, use your browser's installation menu. Support depends on browser and workplace policy.

An installed localhost app needs the launcher running at the same address. Direct HTML files support editing but cannot use this installation flow. There is no service worker for offline app loading, so an installed app needs its host to be reachable when opened.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| API connection fails | Endpoint, credentials, model access, quota, and network connectivity. Try the launcher if direct browser requests are blocked by CORS. |
| WebGPU is unavailable | Choose CPU mode or a configured API provider. The launcher cannot add GPU support. |
| A browser model will not load | Download access, available memory, and worker permissions. Try a smaller model or the launcher when opening the HTML directly fails. |
| CPU generation is slow or returns unusable output | Try a shorter report or another supported model. Small models still need evaluation for the intended language and task. |
| Saved browser app will not open | Restart the launcher at the same port, or check the HTTPS host. |
| Settings will not unlock | Confirm the password and file. Passwords cannot be recovered. |

Temporary HTTP 500, 503, and 504 responses are retried at most twice. Authentication and quota failures are not retried. **Cancel** stops requests and retries. The app displays recognized diagnostic codes while suppressing arbitrary provider error messages that could contain private data.

## Development and releases

Run the verification suites:

```sh
node verify-all.cjs
```

The ten suites cover provider requests, settings encryption, launcher access controls, browser workers, installation, report workflows, release integrity, and release triggers. They use synthetic data and mocked providers/workers.

Run the browser tests with Node.js 22 or newer and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec playwright install chromium firefox
pnpm test:browser
```

Playwright runs 24 scenarios in each browser against the real HTML and local launcher: Review/Revise, text comparison, edits during generation, cancellation, outdated exports, template/provider switching, encrypted settings files, themes, German labels, and narrow layouts. CPU tests run the app's real worker with a synthetic inference module, covering prose, invalid schemas, truncated JSON, and null responses for both CPU model options. Tests block unexpected external requests; they need no API keys or model downloads after test dependencies and browsers are installed.

Use `pnpm test:all` for both sets of checks. The HTML test report is saved in `playwright-report/`; failures also retain screenshots and traces in `test-results/`. These checks establish application behavior with controlled responses, not real model reliability or clinical accuracy.

Build the release package with PowerShell 7:

```sh
pwsh -File build-release.ps1
```

The build uses the explicit file list in `release-files.json`, verifies archive contents, and writes the ZIP, standalone HTML, and `SHA256SUMS.txt` to `dist/`.

GitHub Actions runs all verification suites, archive checks, and Chromium/Firefox tests on every branch push, pull request, and manual run. Browser reports and failure traces are retained for seven days. Publishing additionally requires either a push to `main` that changes `VERSION` or a manual run on `main` with **publish_release** enabled. All verification and browser jobs must pass first; ordinary pushes do not republish an existing version. Update `VERSION`, the displayed app version, this README's version, the changelog, and `release-notes.md` together for a release. Existing published releases are not overwritten.

For static hosting, deploy `index.html`, `report-studio.html`, `manifest.webmanifest`, and `icons/` together. API endpoints must permit requests from the hosted origin.

## License

Project code is licensed under [MIT](LICENSE). The standalone HTML includes the complete project license and a bilingual licenses panel.

Optional runtimes and model assets retain their own licenses. See [third-party notices](THIRD_PARTY_NOTICES.md) and the [license source inventory](licenses/SOURCES.json) for attribution and recorded evidence. Model weights, runtime binaries, browsers, and Node.js are downloaded or installed separately.
