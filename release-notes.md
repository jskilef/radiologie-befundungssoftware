Report Studio v1.4.0 improves the HTML report-review workflow and adds explicit licensing and reproducible release packaging.

- Compare the original submitted report with the editable draft using highlighted additions and deletions, including hints for numbers, units, laterality, negation, and uncertainty.
- Track review notes and revisions independently. Warn when their inputs change and ask before exporting an outdated draft. Preserve edits made while a model response or export confirmation is pending.
- Keep separate provider connection profiles in encrypted settings, clear keys when the endpoint origin changes, and show the processing destination beside report actions.
- Keep pending template edits when switching templates or creating a new one. English and German interface text is included.
- Add the MIT project license, upstream runtime/model license evidence, third-party notices, and checksummed release files.

This release also includes changes since the previous published v1.0.1 release: optional browser-local WebGPU and CPU/WASM inference, improved worker/download diagnostics, and browser-app installation support with a stable localhost launcher address.

Download **report-studio-v1.4.0.zip** for the complete package, including icons, launcher, blank settings example, documentation, tests, and license files. Extract it and open `report-studio.html`, or run `node local-server.cjs` and visit the printed localhost URL. **report-studio.html** is also available separately for standalone browser use; the full ZIP is needed for the complete install/launcher assets. Check downloads against **SHA256SUMS.txt**.

Settings remain password-encrypted and legacy imports are supported. Reports are not autosaved. No credentials, third-party runtime binaries, or model weights are bundled. Optional local inference still downloads its runtime/model assets on first use.

Validation includes the application, launcher, encryption, diagnostics, WebGPU/CPU workers, installation, workflow, and release-integrity verification scripts. Synthetic browser checks covered the comparison, provider fields, templates, outdated-result confirmation, and English/German UI. Live model execution and clinical fidelity remain unverified. Direct `file://` opening was not checked by the browser automation tool, which permits only HTTP/HTTPS.
