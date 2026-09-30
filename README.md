# Report Studio

Open `report-studio.html` by dragging it into Chrome, Edge, or Firefox. No installation, build step, or server is needed for the interface.

1. Load `report-studio-settings.json`, or expand **Connection & templates**.
2. Enter your own API key and a model ID available from your provider. The default endpoint is OpenAI's Chat Completions endpoint; another provider must support the same request/response format and browser CORS access from a local file. A local model server can use an HTTP localhost endpoint and leave the key blank. APIs with different formats are not supported.
3. Type or paste a de-identified report. Choose a template if wanted, then click **Review & revise**.
4. Compare the editable AI revision with the original and check the review notes. Copy or download the revision only after clinical review.
5. Create or edit templates, click **Update template**, then **Save settings file**. This downloads a new JSON file containing the key, endpoint, model, language and all templates. Replace your old settings file with the download if desired. Browsers do not silently overwrite an arbitrary loaded file. Template selection does not automatically save pending edits; update before switching.

The supplied JSON has an empty key and model: no credentials are bundled. Use your own provider credential. The settings file is plain text and must be kept private. The app does not store reports or credentials in browser storage. Reports stay in tab memory except when you explicitly submit a review, copy text or download a report. Closing or reloading clears unsaved work.

The interface is local, but cloud AI processing is not. Report text and selected template content go directly to the endpoint you configure when reviewing. Use only de-identified text and an institution-approved endpoint. The model is instructed to preserve clinical facts and flag contradictions instead of silently resolving them, but its output remains an unvalidated draft and can contain errors or miss issues.

If a request fails with a connection/CORS error, the provider may not permit requests from `file://`. This cannot be bypassed by HTML. Configure an approved compatible local service or gateway to allow the local-file origin. Do not disable browser security. Live provider access requires your credential and has not been verified with the placeholder settings.

API implementation reference: https://developers.openai.com/api/reference/overview
