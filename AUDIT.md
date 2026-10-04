# Project audit — 30 September 2026

Scope: tracked application, loopback launcher, configuration example, documentation, verification scripts, and four existing Git commits. Static code review and mocked-provider checks; no real patient data or live provider requests used.

## Fixed findings

- Session validation compared string lengths before comparing byte buffers. A non-ASCII session header could crash the launcher. Validation now checks byte lengths; regression test reproduces the original failure and verifies rejection.
- Clearing the workspace hid the raw response but retained its content. Clear now removes the raw response text as well as both reports and notes.
- Provider diagnostics omitted Mistral's numeric rate-limit code 1300. The browser and launcher now display this recognised code. Arbitrary provider messages and unrecognised codes remain suppressed to avoid reflecting credentials or patient text.
- The German encryption notice used an obsolete English lookup key. Updated the key and tested the translation.
- README described exports as unencrypted and omitted encryption verification. Updated documentation.

## Verification

- node verify.cjs
- node verify-server.cjs
- node verify-encryption.cjs
- node verify-diagnostics.cjs
- git diff --check
- Credential-pattern scan of all four existing commits: no matches for common OpenAI, Google API, or GitHub token formats. The bundled settings API key is empty. Pattern scanning cannot exclude every possible secret format.

## Remaining limits

- Live API credentials, quota, regional permissions, and provider availability were not verified. Code 1300 does not identify the exact exhausted limit.
- The original audit used mocked DOM/provider responses. The October follow-up below adds real browser workflows; this is still not a comprehensive visual or accessibility audit.
- Clinical fidelity is not established by software checks. Model output and configurable prompts need evaluation on representative reports before clinical deployment.
- This audit does not certify DSGVO, professional confidentiality, medical-device, or AI Act compliance. Those depend on intended purpose, contracts, processing configuration, institutional controls, and clinical validation.
- Encrypted exports protect saved settings; unlocked keys remain in browser memory while the app is open. Legacy plaintext settings still require private handling.
- The launcher is for trusted local use and binds to loopback. Approved endpoint selection remains the user's responsibility; it is not a multiuser production backend.

## Follow-up — 4 October 2026

- Added ten-suite verification and archive checks on ordinary branch pushes, pull requests, and manual runs. Release publication additionally requires a main-branch version change or an explicit manual release request, and successful Chromium/Firefox jobs.
- Added 24 repeatable scenarios per browser for report actions and comparisons, edits during generation, cancellation, outdated exports and dialog focus, provider/template switching, encrypted settings download/import, themes, German labels, and a narrow viewport.
- CPU cases use the production worker with a synthetic inference module in place of the downloaded runtime. Both CPU model selections are tested against prose, invalid schemas, truncated JSON, and null responses. Invalid output retains previous drafts/notes and displays a specific error; cancellation can recover through a fresh worker.
- Test data is synthetic. Unexpected external requests are blocked, and no provider credentials or model weights are required. CI retains browser reports and failure traces for seven days.
- The user reported frequent structured-output failures with small CPU models. These tests cover the application's response to that failure; they do not measure or improve actual inference quality. Live model reliability and clinical fidelity remain unverified by this suite.

Local validation: all ten verification suites, all 48 browser tests (24 each in Chromium and Firefox), and the 45-file archive integrity check passed. Firefox required execution outside the local process sandbox.
