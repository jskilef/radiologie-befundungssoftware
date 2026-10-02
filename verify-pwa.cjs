const handlers={};
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('report-studio.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements={};
function element(){return {value:'',textContent:'',children:[],className:'',replaceChildren(...c){this.children=c},append(...c){this.children.push(...c)},addEventListener(){},focus(){},select(){},click(){},setAttribute(){}}}
const context={location:{protocol:'file:',hostname:''},document:{getElementById(id){return elements[id]??=element()},createElement:element,createTextNode:s=>s},window:{addEventListener(name,callback){handlers[name]=callback}},URL,Blob,AbortController,setTimeout,clearTimeout,console,confirm:()=>true,navigator:{clipboard:{writeText:async()=>{}}},fetch:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({revised_report:'No effusion.',issues:[{category:'Laterality',detail:'Check side.'}],changes:['Corrected spelling.']})}}]})})};
vm.createContext(context);vm.runInContext(script,context);
vm.runInContext(`validate(JSON.parse(${JSON.stringify(fs.readFileSync('report-studio-settings.json','utf8').replace(/^\uFEFF/,''))}))`,context);
assert.throws(()=>vm.runInContext(`validateURL('http://external.example/v1')`,context));
assert.throws(()=>vm.runInContext(`parseReview('{"revised_report":"x","issues":["bad"],"changes":[]}')`,context));
elements.endpoint.value='https://api.openai.com/v1/chat/completions';elements.key.value='mock';elements.model.value='mock-model';elements.source.value='No effusoin.';elements.language.value='Same as original';

(async()=>{await elements.installApp.onclick();assert.equal(elements.installHelp.hidden,false);assert(elements.installHelp.textContent.includes('HTTPS'));let prevented=false,prompted=false;handlers.beforeinstallprompt({preventDefault(){prevented=true},async prompt(){prompted=true},userChoice:Promise.resolve({outcome:'dismissed'})});assert(prevented);await elements.installApp.onclick();assert(prompted);assert.equal(vm.runInContext('pendingInstall',context),null);handlers.appinstalled();assert.equal(elements.installApp.hidden,true);assert.equal(elements.installHelp.hidden,true);console.log('PASS: installation fallback, prompt event, user-triggered install and installed state.');})().catch(e=>{console.error(e);process.exitCode=1});
