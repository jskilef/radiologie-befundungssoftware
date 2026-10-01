# Changelog

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
