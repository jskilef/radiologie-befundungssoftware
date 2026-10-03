# Report Studio v1.4.0

Licensed under [MIT](LICENSE). Optional third-party runtimes and models retain
their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the
[license source inventory](licenses/SOURCES.json). The standalone HTML includes
the complete MIT license and a bilingual licenses panel. No model weights,
runtime binaries, browser, or Node.js executable are bundled.

Drag `report-studio.html` into a browser. Connection & templates starts closed; click Configure API & templates to edit it.

Choose English or Deutsch beside the settings buttons. Save settings file stores `uiLanguage`, `provider`, key, endpoint, model, report language and templates in one password-encrypted JSON file. Interface language and report language are independent. Older version 1 files still load with English as the default. Downloads do not silently overwrite the loaded file.

## Providers

- OpenAI: use your own key, an available model ID, and https://api.openai.com/v1/chat/completions.
- Google Gemini: select Gemini and enter your Gemini key and model ID. Use https://generativelanguage.googleapis.com/v1beta/models as the endpoint. The app adds the model and :generateContent, uses x-goog-api-key authentication, and reads native Gemini responses.
- Other OpenAI-compatible API: enter the full Chat Completions URL and model ID. Compatible gateways and local servers are supported. The key can be blank when authentication is unnecessary. Native proprietary formats such as Anthropic Messages and Azure-specific authentication need a compatible gateway; there are no native adapters for them.

Each provider has its own connection profile (endpoint, key, and model). Switching providers restores that provider's profile; a new profile starts without a key. Other OpenAI-compatible API starts with an empty endpoint. Changing an endpoint to another origin (scheme, host, or port) clears the current key; enter the key for the new endpoint afterward. The processing destination is shown next to the report actions. Test connection makes a small billable generation request without sending your report.

## Fixing connection failures

A browser network error may mean CORS, connectivity, extensions or other browser restrictions. HTML cannot override provider CORS. Do not disable browser security.

If direct browser access fails:

1. With Node.js 18 or newer available, run `node local-server.cjs` in this folder.
2. Open the http://127.0.0.1 URL printed in the terminal. Keep the terminal running.
3. Load your settings JSON, choose the provider, and test the connection.

The optional launcher serves the same app and forwards requests from Node, removing provider CORS as a constraint. It does not fix invalid credentials, quotas, unavailable models or blocked networks. It binds only to loopback, validates origin and session, does not serve settings files, and does not log or save reports or keys. Use HTTPS endpoints or HTTP on localhost. Stop the launcher with Ctrl+C. The standalone HTML still works without it when the endpoint permits browser requests.

## Reports and templates

Review produces issue notes without changing the draft. Revise generates an editable report and notes. Both use the original text and selected template. Compare results with the original and resolve flagged issues before copying or downloading.

Create or edit templates in the configuration panel. Pending edits stay in memory when switching templates or creating another one, including unfinished names. Save settings file validates and saves all templates; every template needs a name. Update template remains available to apply a name immediately. Loading a settings file asks before replacing unsaved settings. The bundled JSON contains no key or model. Settings exports are password-encrypted; keep them private and do not commit credentials or patient text to GitHub. The bundled blank example is a legacy plaintext file with no credentials.

### Comparing and tracking results (v1.4.0)

Changes in draft displays removed and added wording. Amber outlines draw attention to changed spans containing numbers, units, common English/German laterality, negation, or uncertainty terms. This is a word-based aid, not a clinical validator; inspect every change. For very large edits the comparison groups changed passages rather than computing a detailed word diff, without dropping text. The comparison updates when you edit the draft and always uses the original submitted for that revision, even if you subsequently change the original.

Review notes and revised drafts separately retain their submitted report, template structure/style, task prompt, report and interface languages, provider, endpoint, model, and completion time in memory. Relevant input changes mark the corresponding result as outdated. Manual draft edits are identified, and notes from that revision are marked for rechecking. Failed actions retain the last successful notes/draft with a warning. A late model response never replaces a draft edited during generation.

Copying or saving an outdated draft, or a draft whose latest revision failed, opens an accessible in-page confirmation with Keep editing as the initial focus. If the draft changes while confirmation is open, the export is cancelled. Clear workspace also removes result context and comparison content. Reports, comparison text and result context are never added to settings exports or automatically stored.

Provider profiles are included inside the existing password-encrypted settings envelope. Legacy files without profiles still load; they initialize only their selected provider. Older app versions can read the selected connection fields but do not preserve the additional profiles when re-exporting.

The interface is local; cloud processing is not. Report text and selected template go to your configured endpoint, directly or through the local launcher. Use de-identified text and an institution-approved service. AI results require clinical review. No browser storage or automatic saving is used; closing or reloading clears unsaved work.

## Verification

Run every verification suite with `node verify-all.cjs`. The release-integrity
suite also checks version consistency, the standalone MIT text, included upstream
license hashes, the package file list, and the blank settings example.

Run `node verify.cjs`, `node verify-server.cjs`, `node verify-encryption.cjs`, `node verify-diagnostics.cjs`, `node verify-webllm.cjs`, `node verify-cpu.cjs`, `node verify-pwa.cjs`, and `node verify-workflow.cjs`. These use mocked providers to check API formats, separate actions, language/settings persistence, old settings, launcher access controls, workers, and installation behavior. The workflow suite adds event-aware checks for provider isolation, encrypted profiles, template preservation, exact/bounded diffs, outdated results, export decisions, and edits during generation. Live provider access is unverified without your credential.

API references: [OpenAI](https://developers.openai.com/api/reference/overview), [Gemini](https://ai.google.dev/api/generate-content).

Temporary HTTP 500, 503 and 504 responses are retried at most twice with increasing delays. Cancel stops retries. Retry-After delays over 30 seconds are reported without automatic retry; credentials and quota errors are not retried. No model/provider is changed automatically.

## Advanced prompts

Configure API & templates contains an Advanced settings toggle. Prompt fields remain hidden until enabled. Review and Revise have independent, editable task instructions. The app adds the JSON response contract and review-note language automatically; templates and original report remain separate input data. Edits apply to the next action. Save settings stores both instructions under `prompts.review` and `prompts.revise`. Older settings without prompts use the defaults. Each prompt must be non-empty and at most 20,000 characters. Reset buttons restore individual defaults. Loading settings hides the advanced panel again.

## Password-encrypted settings

Save settings file asks for a password (at least 12 characters) and confirmation, then downloads report-studio-settings.encrypted.json. The entire settings payload, including key, templates, prompts, model and language, is encrypted locally with AES-256-GCM. PBKDF2-SHA256 with 600,000 iterations and a fresh random 16-byte salt derives the key; each export uses a fresh random 12-byte IV. The JSON envelope contains only format/algorithm metadata, salt, IV and authenticated ciphertext.

Loading an encrypted file asks for its password. Wrong passwords and corrupted files leave the current settings untouched. Passwords are not saved or sent to the launcher or provider. After unlocking, the settings and API key remain in tab memory to run requests; closing/reloading clears them. Encryption protects the saved file, not an unlocked browser session. There is no password recovery; keep a secure copy of your password. Use a current browser with Web Crypto support (or the localhost launcher).

Legacy plaintext settings can be imported for migration. Save them to create an encrypted copy, verify that it unlocks, and remove or securely manage the old plaintext copy yourself. The app does not delete existing files. New exports are always encrypted. No password or real credential is bundled in the repository.

Provider errors display recognised diagnostic codes, including Mistral `1300`, without forwarding arbitrary error messages that could contain credentials or report text. A displayed rate limit does not establish remaining quota or model access.

## Browser-local WebLLM (v1.1.0)

Choose Browser local · WebLLM (WebGPU) under Configure API & templates, then choose a browser model. Test connection downloads and loads it and runs a small local generation; Review and Revise use it without an API key or cloud inference. WebGPU is required; this option will not work on computers without it. CPU/WASM is available separately from v1.2.0; local-server presets remain pending.

Available 4-bit models: Qwen3 0.6B, 1.7B, and 4B. Approximate WebLLM GPU-memory estimates are 1.4, 2.0, and 3.4 GB respectively, with the default 4,096-token context. Prompts, templates, reports, and output share the context. Start with the smallest model. JSON output is constrained, but clinical fidelity and quality remain unverified.

Runtime is pinned to WebLLM 0.2.85 and loaded in a module worker. First use contacts jsDelivr, GitHub and Hugging Face for runtime/model assets; large downloads may be blocked by workplace policy. Model assets may persist in browser cache; Cancel or Unload releases worker/GPU memory but does not remove cached model files. Clear workspace also terminates the local model worker. Reports are supplied only to the local worker in this mode, not to the app API gateway. Reopen/reload or the localhost launcher may help where file-origin worker restrictions apply, but cannot add missing WebGPU support.

The selected provider and browser model are saved in the encrypted settings file. Local loading/generation has a 20-minute timeout and can be cancelled. No cloud fallback is automatic. Tests: node verify-webllm.cjs uses mocked workers/runtime; real GPU execution and full model downloads are not verified in this environment.

References: https://webllm.mlc.ai/docs/user/basic_usage.html and https://github.com/mlc-ai/web-llm/blob/main/src/config.ts

## Browser CPU (v1.2.0)

Select Browser local · CPU (WebAssembly), then a CPU model and Test connection. No WebGPU, API key, or external inference server is required. Qwen3 0.6B uses q8 quantization (approximately 618 MB for model weights) and supports multilingual experimentation; SmolLM2 135M uses q8 and is a tiny, English-focused test option. It is not a substitute for validating German radiology output.

Transformers.js is pinned to 3.8.1. The module worker uses ONNX Runtime WASM, a single thread, and no nested proxy worker, avoiding a requirement for cross-origin isolation. Modern WebAssembly support, enough RAM, and access to jsDelivr/Hugging Face model downloads are still needed. The initial download can be large; CPU inference may take minutes. Inputs over 2,048 tokens are rejected without truncation; output is capped at 1,024 new tokens. Unlike WebLLM, JSON is prompt-guided rather than grammar-constrained, and malformed output is rejected by the existing parser.

All inference runs in the browser worker. Runtime/model assets can be cached, but reports are not uploaded to a cloud inference API. Cancel, Unload browser model, or Clear workspace terminates the worker. Selected provider/model are included in encrypted settings. If file-origin module workers are blocked, use the optional localhost launcher; it serves the interface but CPU report generation still happens in the worker. The app does not automatically fall back to cloud providers.

Run node verify-cpu.cjs for mocked CPU-worker/runtime checks. Full model execution on a real browser/work PC remains unverified. Reference: https://huggingface.co/docs/transformers.js/v3.8.1/index

CPU troubleshooting in Brave: version 1.2.2 uses a classic CPU worker for direct HTML opening. If loading still fails, the message identifies runtime import (jsDelivr), model initialization (Hugging Face/RAM), or generation. Try the localhost launcher. Version 1.2.4 distinguishes recognized download, memory, compatibility and WASM session failures. SmolLM2-135M is only a runtime test option and may fail to produce usable report output. Workplace restrictions can still block downloads. This change has automated worker tests; actual Brave inference has not been verified.

## Release packaging

Download the complete ZIP from [GitHub Releases](https://github.com/jskilef/radiologie-befundungssoftware/releases).
It includes the HTML, launcher, installation assets, blank settings example,
documentation, tests, and license files. The separate HTML download includes the
project license but needs the ZIP's companion files for the complete launcher and
browser-installation setup. `SHA256SUMS.txt` lists hashes for both downloads.

To build from source, run `node verify-all.cjs`, then `pwsh -File build-release.ps1`
(PowerShell 7). Output goes to the ignored `dist` folder. The script packages only
the files in `release-files.json`, verifies each archived file against its source,
and generates checksums. It never packages arbitrary workspace or settings files.

The GitHub Actions workflow verifies pull requests. A push to `main` changing
`VERSION`, or a manual run on `main`, verifies the project, builds the package, and
publishes that version at the tested commit. Update `VERSION`, the displayed app
version, README, changelog, and `release-notes.md` together. Existing published
releases are not overwritten; a release at a different commit causes an error.
The workflow uses the repository's built-in token with write permission only in
the publishing job. No separate deployment credential is required.

## Save as a browser app (v1.3.0)

Open Report Studio over HTTPS or run the existing `node local-server.cjs` launcher and visit `http://127.0.0.1:8787`. Choose **Save as app**; when the browser provides an installation prompt, the button opens it. Otherwise follow the browser's Install app menu. In Brave/Edge/Chrome the resulting app can open in its own window. Browser policy can restrict installation. Direct file:// opening still works for editing, but cannot use the PWA installation flow.

The launcher now uses stable port 8787 so the saved app can reopen the same address. Keep the launcher running; restart it before reopening the installed localhost app. REPORT_STUDIO_PORT can select another stable port. Existing launcher URLs with random ports must be reopened at the new address. No separate desktop/model program is added.

For HTTPS hosting, deploy `index.html`, `report-studio.html`, `manifest.webmanifest`, and the `icons` directory together. These files are ready for static hosting; this change does not publish a hosted site. API access from static hosting still requires provider CORS support. Installation does not fix browser inference limits. No service worker/offline cache is added, so the app requires its host to be reachable when opened; settings still use the encrypted export/import workflow.
