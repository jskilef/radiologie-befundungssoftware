const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('report-studio.html','utf8');
const elements={};
const element=()=>({value:'',textContent:'',children:[],replaceChildren(...c){this.children=c},append(...c){this.children.push(...c)},addEventListener(){},setAttribute(){}});
const context={document:{getElementById(id){return elements[id]??=element()},createElement:element},location:{protocol:'file:',hostname:''},window:{addEventListener(){}},URL,Blob,AbortController,setTimeout,clearTimeout,confirm:()=>true,console};
vm.createContext(context);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
(async()=>{
 context.request={url:'https://example.com',headers:{},body:{}};
 context.fetch=async()=>({ok:false,status:429,json:async()=>({code:'1300',message:'private content'})});
 await assert.rejects(vm.runInContext('sendRequest(request)',context),e=>e.message.includes('[1300]')&&!e.message.includes('private content'));
 context.fetch=async()=>({ok:false,status:403,json:async()=>({code:'private content',message:'private content'})});
 await assert.rejects(vm.runInContext('sendRequest(request)',context),e=>!e.message.includes('private content'));
 for(const id of ['source','revision','raw','context','rawBox','count'])context.document.getElementById(id);
 elements.source.value='Report';elements.revision.value='Draft';elements.raw.textContent='Private raw response';
 elements.clear.onclick();assert.equal(elements.raw.textContent,'');assert.equal(elements.source.value,'');assert.equal(elements.revision.value,'');
 elements.uiLanguage.value='de';assert.match(vm.runInContext("translate('API modes send reports to the configured endpoint. Browser-local modes process reports on this device. Use de-identified text and an institution-approved service. Saved settings are password-encrypted. AI suggestions require clinical review before use.')",context),/passwortverschlüsselt/);
 console.log('PASS: Mistral numeric diagnostics, private error suppression, workspace clearing, translated encryption notice.');
})().catch(e=>{console.error(e);process.exitCode=1;});
