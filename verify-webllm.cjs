const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('report-studio.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements={};
function element(){return {value:'',textContent:'',children:[],className:'',replaceChildren(...c){this.children=c},append(...c){this.children.push(...c)},addEventListener(){},focus(){},select(){},click(){},setAttribute(){}}}
const context={location:{protocol:'file:',hostname:''},document:{getElementById(id){return elements[id]??=element()},createElement:element,createTextNode:s=>s},window:{addEventListener(){}},URL,Blob,AbortController,setTimeout,clearTimeout,console,confirm:()=>true,navigator:{clipboard:{writeText:async()=>{}}},fetch:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({revised_report:'No effusion.',issues:[{category:'Laterality',detail:'Check side.'}],changes:['Corrected spelling.']})}}]})})};
vm.createContext(context);vm.runInContext(script,context);
vm.runInContext(`validate(JSON.parse(${JSON.stringify(fs.readFileSync('report-studio-settings.json','utf8').replace(/^\uFEFF/,''))}))`,context);
assert.throws(()=>vm.runInContext(`validateURL('http://external.example/v1')`,context));
assert.throws(()=>vm.runInContext(`parseReview('{"revised_report":"x","issues":["bad"],"changes":[]}')`,context));
elements.endpoint.value='https://api.openai.com/v1/chat/completions';elements.key.value='mock';elements.model.value='mock-model';elements.source.value='No effusoin.';elements.language.value='Same as original';

(async()=>{
 elements.provider.value='webllm';elements.browserModel.value='Qwen3-0.6B-q4f16_1-MLC';elements.endpoint.value='https://api.openai.com/v1/chat/completions';elements.key.value='unused-private-key';elements.model.value=elements.browserModel.value;elements.language.value='Same as original';
 vm.runInContext('syncProvider()',context);assert.equal(elements.endpoint.disabled,true);assert.equal(elements.key.disabled,true);assert.equal(elements.webllmOptions.hidden,false);
 const request=vm.runInContext("buildRequest('webllm','https://api.openai.com/v1/chat/completions','secret','Qwen3-0.6B-q4f16_1-MLC','instructions','report')",context);assert.equal(request.local,'webllm');assert(!JSON.stringify(request).includes('secret'));context.localRequest=request;await assert.rejects(vm.runInContext('sendRequest(localRequest)',context),/WebGPU is unavailable/);
 context.navigator.gpu={};let worker,networkCalls=0;context.fetch=async()=>{networkCalls++;throw Error('Unexpected cloud request')};context.Worker=class{constructor(){worker=this;}postMessage(data){this.payload=data;}terminate(){this.terminated=true;}};
 const result=vm.runInContext('sendRequest(localRequest)',context);worker.onmessage({data:{type:'progress',progress:.5}});assert.match(elements.modelProgress.textContent,/50%/);worker.onmessage({data:{type:'result',response:{choices:[{message:{content:'{}'},finish_reason:'stop'}]}}});assert.equal((await result).choices[0].message.content,'{}');assert.equal(networkCalls,0);
 const abort=new AbortController();context.localSignal=abort.signal;const pending=vm.runInContext('sendRequest(localRequest,localSignal)',context);abort.abort();await assert.rejects(pending,e=>e.name==='AbortError');assert.equal(worker.terminated,true);
 const failed=vm.runInContext('sendRequest(localRequest)',context);worker.onerror();await assert.rejects(failed,/worker failed/);
 const settings=vm.runInContext('validate(config())',context);assert.equal(settings.provider,'webllm');assert.equal(settings.model,elements.model.value);
 elements.provider.value='openai';vm.runInContext('syncProvider()',context);assert.equal(elements.key.disabled,false);assert.equal(elements.webllmOptions.hidden,true);
 // Exercise embedded worker orchestration with a mocked runtime (no model download).
 const events=[];let loads=0,calls=0;const workerContext={self:{postMessage:event=>events.push(event)},mockImport:async()=>({CreateMLCEngine:async(model,options)=>{loads++;options.initProgressCallback({progress:1});return {unload:async()=>{},chat:{completions:{create:async opts=>{calls++;assert.equal(opts.response_format.type,'json_object');assert.equal(opts.extra_body.enable_thinking,false);return {choices:[{message:{content:'{}'}}]};}}}};}})};
 vm.createContext(workerContext);const source=vm.runInContext('BROWSER_WORKER_SOURCE',context).replace("import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm')",'mockImport()');vm.runInContext(source,workerContext);await workerContext.self.onmessage({data:{model:request.model,messages:request.messages}});await workerContext.self.onmessage({data:{model:request.model,messages:request.messages}});assert.equal(loads,1);assert.equal(calls,2);assert.equal(events.at(-1).type,'result');
 console.log('PASS: WebLLM local routing without keys/cloud fetch, unsupported WebGPU, download progress, cancellation, worker failure, settings persistence, runtime reuse and JSON generation configuration.');
})().catch(e=>{console.error(e);process.exitCode=1;});
