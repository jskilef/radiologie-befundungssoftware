const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('report-studio.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements={};
function element(){return {value:'',textContent:'',children:[],className:'',replaceChildren(...c){this.children=c},append(...c){this.children.push(...c)},addEventListener(){},focus(){},select(){},click(){},setAttribute(){}}}
const context={crypto:require('node:crypto').webcrypto,TextEncoder,TextDecoder,Uint8Array,btoa,atob,location:{protocol:'file:',hostname:''},document:{getElementById(id){return elements[id]??=element()},createElement:element,createTextNode:s=>s},window:{addEventListener(){}},URL,Blob,AbortController,setTimeout,clearTimeout,console,confirm:()=>true,navigator:{clipboard:{writeText:async()=>{}}},fetch:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({revised_report:'No effusion.',issues:[{category:'Laterality',detail:'Check side.'}],changes:['Corrected spelling.']})}}]})})};
vm.createContext(context);vm.runInContext(script,context);
vm.runInContext(`validate(JSON.parse(${JSON.stringify(fs.readFileSync('report-studio-settings.json','utf8').replace(/^\uFEFF/,''))}))`,context);
assert.throws(()=>vm.runInContext(`validateURL('http://external.example/v1')`,context));
assert.throws(()=>vm.runInContext(`parseReview('{"revised_report":"x","issues":["bad"],"changes":[]}')`,context));
elements.endpoint.value='https://api.openai.com/v1/chat/completions';elements.key.value='mock';elements.model.value='mock-model';elements.source.value='No effusoin.';elements.language.value='Same as original';

(async()=>{
 const plain=JSON.parse(vm.runInContext('JSON.stringify(config())',context));plain.apiKey='test-secret-never-publish';context.plainSettings=plain;context.secretPassword='A long test passphrase 123';
 const first=await vm.runInContext('encryptSettings(plainSettings,secretPassword)',context);context.encryptedSettings=first;
 const second=await vm.runInContext('encryptSettings(plainSettings,secretPassword)',context);
 assert.notEqual(first.salt,second.salt);assert.notEqual(first.iv,second.iv);assert.notEqual(first.ciphertext,second.ciphertext);
 assert(!JSON.stringify(first).includes(plain.apiKey));assert(!JSON.stringify(first).includes(plain.prompts.review));assert.equal(first.apiKey,undefined);
 assert.deepEqual(JSON.parse(JSON.stringify(await vm.runInContext('decryptSettings(encryptedSettings,secretPassword)',context))),plain);
 await assert.rejects(vm.runInContext("decryptSettings(encryptedSettings,'wrong password')",context),/Incorrect password/);
 context.tampered={...first,ciphertext:(first.ciphertext[0]==='A'?'B':'A')+first.ciphertext.slice(1)};
 await assert.rejects(vm.runInContext('decryptSettings(tampered,secretPassword)',context),/Incorrect password/);
 context.badFormat={...first,iterations:99999999};assert.throws(()=>vm.runInContext('validateEnvelope(badFormat)',context),/Invalid encrypted/);
 await assert.rejects(vm.runInContext("encryptSettings(plainSettings,'short')",context),/12 characters/);
 elements.key.value='keep-existing';elements.load.files=[{size:100,text:async()=>JSON.stringify(first)}];
 vm.runInContext("askPassword=async()=> 'wrong password'",context);await elements.load.onchange({target:elements.load});assert.equal(elements.key.value,'keep-existing');assert.match(elements.status.textContent,/Incorrect password/);
 vm.runInContext('askPassword=async()=>null',context);await elements.load.onchange({target:elements.load});assert.equal(elements.key.value,'keep-existing');assert.match(elements.status.textContent,/cancelled/);
 vm.runInContext('askPassword=async()=>secretPassword',context);await elements.load.onchange({target:elements.load});assert.equal(elements.key.value,plain.apiKey);assert.equal(elements.export.disabled,false);
 let downloaded;context.captureDownload=(name,text)=>{downloaded={name,text};};vm.runInContext('saveFile=captureDownload',context);await elements.export.onclick();assert.equal(downloaded.name,'report-studio-settings.encrypted.json');assert.equal(JSON.parse(downloaded.text).format,'report-studio-encrypted-settings');assert(!downloaded.text.includes(plain.apiKey));
 vm.runInContext('askPassword=async()=>null',context);downloaded=null;await elements.export.onclick();assert.equal(downloaded,null);
 console.log('PASS: authenticated encryption round-trip, randomized salt/IV, secret absence, wrong password, tamper rejection, KDF limits, password length, import/export cancellation, failed load preserves settings, encrypted-only exports.');
})().catch(e=>{console.error(e);process.exitCode=1;});
