# Report Studio

Drag `report-studio.html` into a browser. Connection & templates starts closed; click Configure API & templates to edit it.

Choose English or Deutsch beside the settings buttons. Save settings file stores `uiLanguage`, `provider`, key, endpoint, model, report language and templates in one JSON file. Interface language and report language are independent. Older version 1 files still load with English as the default. Downloads do not silently overwrite the loaded file.

## Providers

- OpenAI: use your own key, an available model ID, and https://api.openai.com/v1/chat/completions.
- Google Gemini: select Gemini and enter your Gemini key and model ID. Use https://generativelanguage.googleapis.com/v1beta/models as the endpoint. The app adds the model and :generateContent, uses x-goog-api-key authentication, and reads native Gemini responses.
- Other OpenAI-compatible API: enter the full Chat Completions URL and model ID. Compatible gateways and local servers are supported. The key can be blank when authentication is unnecessary. Native proprietary formats such as Anthropic Messages and Azure-specific authentication need a compatible gateway; there are no native adapters for them.

Changing provider applies its default endpoint; enter the matching key and model. Test connection makes a small billable generation request without sending your report.

## Fixing connection failures

A browser network error may mean CORS, connectivity, extensions or other browser restrictions. HTML cannot override provider CORS. Do not disable browser security.

If direct browser access fails:

1. With Node.js 18 or newer available, run `node local-server.cjs` in this folder.
2. Open the http://127.0.0.1 URL printed in the terminal. Keep the terminal running.
3. Load your settings JSON, choose the provider, and test the connection.

The optional launcher serves the same app and forwards requests from Node, removing provider CORS as a constraint. It does not fix invalid credentials, quotas, unavailable models or blocked networks. It binds only to loopback, validates origin and session, does not serve settings files, and does not log or save reports or keys. Use HTTPS endpoints or HTTP on localhost. Stop the launcher with Ctrl+C. The standalone HTML still works without it when the endpoint permits browser requests.

## Reports and templates

Review produces issue notes without changing the draft. Revise generates an editable report and notes. Both use the original text and selected template. Compare results with the original and resolve flagged issues before copying or downloading.

Create or edit templates in the configuration panel, click Update template, then Save settings file. Update before switching templates to keep pending edits. The bundled JSON contains no key or model. Settings exports are password-encrypted; keep them private and do not commit credentials or patient text to GitHub. The bundled blank example is a legacy plaintext file with no credentials.

The interface is local; cloud processing is not. Report text and selected template go to your configured endpoint, directly or through the local launcher. Use de-identified text and an institution-approved service. AI results require clinical review. No browser storage or automatic saving is used; closing or reloading clears unsaved work.

## Verification

Run `node verify.cjs`, `node verify-server.cjs`, and `node verify-encryption.cjs`. These use mocked providers to check API formats, separate actions, language/settings persistence, old settings, and launcher access controls. Live provider access is unverified without your credential.

API references: [OpenAI](https://developers.openai.com/api/reference/overview), [Gemini](https://ai.google.dev/api/generate-content).

Temporary HTTP 500, 503 and 504 responses are retried at most twice with increasing delays. Cancel stops retries. Retry-After delays over 30 seconds are reported without automatic retry; credentials and quota errors are not retried. No model/provider is changed automatically.

## Advanced prompts

Configure API & templates contains an Advanced settings toggle. Prompt fields remain hidden until enabled. Review and Revise have independent, editable task instructions. The app adds the JSON response contract and review-note language automatically; templates and original report remain separate input data. Edits apply to the next action. Save settings stores both instructions under `prompts.review` and `prompts.revise`. Older settings without prompts use the defaults. Each prompt must be non-empty and at most 20,000 characters. Reset buttons restore individual defaults. Loading settings hides the advanced panel again.

## Password-encrypted settings

Save settings file asks for a password (at least 12 characters) and confirmation, then downloads report-studio-settings.encrypted.json. The entire settings payload, including key, templates, prompts, model and language, is encrypted locally with AES-256-GCM. PBKDF2-SHA256 with 600,000 iterations and a fresh random 16-byte salt derives the key; each export uses a fresh random 12-byte IV. The JSON envelope contains only format/algorithm metadata, salt, IV and authenticated ciphertext.

Loading an encrypted file asks for its password. Wrong passwords and corrupted files leave the current settings untouched. Passwords are not saved or sent to the launcher or provider. After unlocking, the settings and API key remain in tab memory to run requests; closing/reloading clears them. Encryption protects the saved file, not an unlocked browser session. There is no password recovery; keep a secure copy of your password. Use a current browser with Web Crypto support (or the localhost launcher).

Legacy plaintext settings can be imported for migration. Save them to create an encrypted copy, verify that it unlocks, and remove or securely manage the old plaintext copy yourself. The app does not delete existing files. New exports are always encrypted. No password or real credential is bundled in the repository.
