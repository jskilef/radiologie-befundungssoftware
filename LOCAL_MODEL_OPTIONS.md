# Local inference options — research only

Reviewed 2026-10-03. None of these candidates has been added, downloaded, or
benchmarked in Report Studio. The current WebLLM/Qwen3 and CPU options remain
unchanged. These are engineering recommendations for a future comparison,
not evidence of improved report accuracy.

## Alternative models using the existing WebLLM runtime

My first comparison would be **Phi-4-mini-instruct** and **Llama 3.2 3B Instruct**
against the existing Qwen3 1.7B/4B options. Both model cards list German, so they
are relevant candidates for this bilingual app. Phi has simpler base-model
licensing; Llama offers a smaller declared GPU-memory requirement.

The following exact IDs already occur in the
[WebLLM 0.2.85 registry](https://github.com/mlc-ai/web-llm/blob/v0.2.85/src/config.ts),
the version used by Report Studio. Memory figures are the registry's estimates
for these variants, not measured download sizes or guaranteed hardware limits.
All three listed entries set a 4,096-token context window; that is a total
budget for instructions, template, report, and generated output.

| Candidate | Registry ID | GPU memory estimate | Why compare it / main tradeoff |
| --- | --- | --- | --- |
| Phi-4-mini-instruct | `Phi-4-mini-instruct-q4f16_1-MLC` | 3,438 MB | Multilingual candidate with an MIT-licensed base model; larger than the smallest current options. |
| Llama 3.2 3B Instruct | `Llama-3.2-3B-Instruct-q4f16_1-MLC` | 2,264 MB | German is officially supported; uses the custom Llama 3.2 Community License and associated requirements. |
| Mistral 7B Instruct v0.3 | `Mistral-7B-Instruct-v0.3-q4f16_1-MLC` | 4,573 MB | A larger comparison candidate with Apache-2.0 base weights; requires more GPU memory, and the registry explicitly requires `shader-f16`. |

Model and license sources: [Microsoft Phi-4-mini](https://huggingface.co/microsoft/Phi-4-mini-instruct),
[Meta Llama 3.2](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct),
[Mistral 7B v0.3](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3).
Before shipping a candidate, also check the exact converted MLC weights and
compiled model-library notices. A base-model license does not by itself finish
that dependency review.

## Alternatives to the runtime itself

| Option | Fit for this project | Tradeoff |
| --- | --- | --- |
| **Transformers.js on WebGPU** | My first browser-runtime experiment: the app already uses Transformers.js for CPU inference, and the library supports GPU execution with `device: 'webgpu'`. | Requires suitable ONNX models and evaluation of GPU operators, quantization, memory, and structured output; CPU success does not establish GPU compatibility. [Documentation](https://huggingface.co/docs/transformers.js/v3.8.1/en/guides/webgpu). |
| **LiteRT-LM Web API** | A separate WebGPU runtime with a JavaScript API, streaming, and cancellation. | Google's documentation labels it an early preview with text input/output. Requires its own model format and an adapter. Prefer evaluating this over starting a new MediaPipe LLM integration, which is now maintenance-only. [LiteRT-LM](https://developers.google.com/edge/litert-lm/js), [MediaPipe migration notice](https://developers.google.com/edge/mediapipe/solutions/genai/llm_inference/web_js). |
| **llama.cpp or Ollama on localhost** | My first option if installing a local application is acceptable. They expose OpenAI-compatible APIs, matching the app's existing generic connection route. llama.cpp also offers schema-constrained JSON. | Requires a local process and model installation; inference runs outside the browser. This may offer more hardware/model choices but is not the standalone-browser experience. [llama.cpp server](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md), [Ollama compatibility](https://docs.ollama.com/api/openai-compatibility). |
| **Chrome Prompt API** | An exploratory option where Chrome manages a built-in local model. | Less control over the selected model and constrained browser/hardware availability; a weaker fit for broad browser support and reproducible model comparisons. [Chrome documentation](https://developer.chrome.com/docs/ai/prompt-api). |

## A useful comparison before choosing

Use the same synthetic English/German reports, task prompts, and generation
limits. Check laterality, negation, measurements, uncertainty, retained headings,
and valid review/revision JSON. Record cold download/startup, warm generation
time, peak memory, cancellation behavior, and maximum practical report length
on the intended machines. My preferred order is Phi/Llama within WebLLM first,
then Transformers.js WebGPU; evaluate a localhost server separately if desktop
installation is acceptable.
