# Changelog

## Unreleased

- Run verification, release archive checks, and repeatable Chromium/Firefox browser tests on ordinary branch pushes, pull requests, and manual runs. Require passing checks before publishing; only a main-branch version change or explicit manual release request publishes a release.
- Cover report editing, cancellation, outdated exports, encrypted settings, provider/template switching, and themes in the real page. Exercise malformed CPU responses through the app's real worker with synthetic inference fixtures; preserve previous drafts and explain structured-output failures in English and German.
- Add System, Studio Light, Slate Dark, Midnight, Cobalt Light, and Cobalt Dark appearance options with English/German labels. Apply the selected palette before first paint and follow live system appearance changes in System mode.
- Adapt fields, dialogs, focus rings, links, review warnings, and text comparisons to each palette. Remember only the theme preference locally; preserve in-memory report state and keep appearance independent of settings imports/exports.

## 1.4.0 — 2026-10-03

- Show an exact text comparison with additions, deletions, and hints for changed numbers, units, laterality, negation, and uncertainty. Bound expensive comparisons for large edits and retain the original submitted for each revision.
- Track review notes and revisions separately, flag outdated inputs and failed attempts, and require an in-page decision before exporting an outdated draft. Preserve manual edits made during generation or export confirmation.
- Keep separate provider connection profiles in memory and encrypted settings; clear the current key when the endpoint origin changes. Show the processing destination beside report actions.
- Preserve pending template edits when switching templates or creating another template. Ask before replacing unsaved settings on import.
- Add English/German interface text and workflow regression checks. Preserve standalone HTML distribution and legacy settings import; no report autosaving is introduced.
- License original project code under MIT. Include upstream runtime/model license evidence, third-party notices, source hashes, and a standalone HTML license panel.
- Add a release file manifest, archive integrity checks, SHA-256 checksums, and a GitHub Actions workflow that tests before publishing a new version.

Validation: all nine verification suites, including release/license integrity; synthetic browser checks of comparison rendering, template switching, provider fields, outdated-result warnings, and the English/German interface. Live inference and clinical fidelity remain unverified.

## 1.3.0 — 2026-10-02

- Add standalone web-app manifest, PNG icons, HTTPS entry page and user-triggered Save as app button with German/English guidance.
- Serve install assets and the manifest start URL from the existing localhost launcher. Use stable port 8787 (configurable via REPORT_STUDIO_PORT) for saved app shortcuts.
- Preserve direct HTML use and encrypted settings workflow. No offline cache or native model program is added. Browser installation remains subject to browser support and policy.

## 1.2.4 — 2026-10-01

- Use q8 for CPU Qwen (published model file approximately 618 MB versus q4 approximately 919 MB).
- Classify recognized download, memory, unsupported-operator and WASM session failures using fixed messages; never expose raw exception text. Unknown errors remain explicitly unknown.
- Browser inference compatibility remains unverified.

## 1.2.3 — 2026-10-01

- Add an explicit JSON example to CPU task prompts while retaining custom user instructions.
- Apply a modest repetition penalty to CPU generation. Malformed output is still rejected.
- Explain the limitations of SmolLM2-135M when CPU output is unstructured; suggest Qwen3-0.6B. Actual inference quality remains unverified.


## 1.2.2

- CPU mode uses a classic worker to avoid the module-worker startup path when opening the HTML directly in Brave.
- CPU loading failures distinguish runtime import, model initialization, and generation without exposing report text.

## 1.2.1 — 2026-10-01

- Keep worker Blob URLs alive until worker termination instead of revoking them immediately during startup.
- Release worker URLs on cancellation, failure and unload.
- Distinguish CPU worker failures from WebGPU failures and explain localhost/worker-policy checks.


## 1.2.0 — 2026-10-01

- Add browser CPU provider using Transformers.js 3.8.1 and single-threaded WebAssembly.
- Offer multilingual Qwen3 0.6B and tiny English-focused SmolLM2 135M models.
- Save CPU provider/model in encrypted settings, reject oversized input, and support worker cancellation/unloading.
- Add mocked CPU-worker/runtime tests; real model execution remains unverified.


## 1.1.0 — 2026-10-01

- Add browser-local WebLLM provider with three 4-bit Qwen3 models.
- Show loading progress, support worker cancellation/unloading, and explain missing WebGPU.
- Save browser provider/model choices in existing encrypted settings. No cloud fallback.
- Add mocked worker/runtime verification; actual GPU inference remains unverified.


## 1.0.1 — 2026-09-30

- Add an English/German About section with links to the project, releases, and issue reporting.
- Update the displayed app version and document the patch release.
- Settings formats remain compatible: plaintext schema version 1 and encrypted envelope version 2.

Validation: report workflow, launcher, encryption, and provider diagnostic verification suites passed. Live provider access and clinical accuracy are not established by these checks.

## 1.0.0 — 2026-09-30

- Standalone local HTML app with separate Review and Revise actions.
- English/German interface, templates, and editable advanced prompts.
- OpenAI, Gemini, and OpenAI-compatible APIs; connection tests and bounded retries.
- Password-encrypted settings exports and optional loopback launcher.
- Launcher security fixes and safe provider diagnostic codes.
