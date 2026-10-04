'use strict';
const ORIGINAL = 'Synthetic example: No left pleural effusion. Nodule measures 3 mm.';
const REVISED = 'Synthetic example: No left pleural effusion. The nodule measures 3 mm.';
const reviewResult = {issues: [{category: 'Clarity', detail: 'Check the phrasing of the measurement.'}], changes: []};
const completion = content => ({choices: [{finish_reason: 'stop', message: {content}}]});

// A tiny ESM replacement for the downloaded library. It runs inside the app's real
// CPU worker, preserving import, progress, message, parsing, and cancellation paths.
// It does not evaluate model quality or execute ONNX inference.
const cpuRuntime = `
export const env = {backends: {onnx: {wasm: {}}}};
export async function pipeline(task, model, options) {
  options.progress_callback({status:'progress', progress:100});
  const generator = async rendered => {
    const messages = JSON.parse(rendered);
    const {report} = JSON.parse(messages.at(-1).content);
    if (report.includes('CPU_CANCEL')) await new Promise(() => {});
    let generated_text;
    if (report.includes('CPU_PROSE')) generated_text = 'The report looks clear. No edits are necessary.';
    else if (report.includes('CPU_SCHEMA')) generated_text = JSON.stringify({revised_report:'Do not accept this draft.',issues:['wrong shape'],changes:[]});
    else if (report.includes('CPU_TRUNCATED')) generated_text = '{"revised_report":"unfinished';
    else if (report.includes('CPU_NULL')) generated_text = 'null';
    else generated_text = JSON.stringify({revised_report:${JSON.stringify(REVISED)},issues:[],changes:[]});
    return [{generated_text}];
  };
  generator.tokenizer = () => ({input_ids:{dims:[1,100]}});
  generator.tokenizer.apply_chat_template = messages => JSON.stringify(messages);
  generator.dispose = async () => {};
  return generator;
}`;

module.exports = {ORIGINAL, REVISED, reviewResult, completion, cpuRuntime};
