const assert = require('node:assert/strict');
const {createServer} = require('./local-server.cjs');
(async () => {
  let captured, failure;
  const server = createServer({upstreamFetch:async (url, options) => {
    captured = {url,options};
    if (failure) return {ok:false,status:429,json:async()=>failure};
    return {ok:true,json:async()=>({choices:[{message:{content:'ok'}}]})};
  }});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await (await fetch(base)).text();
    const manifestResponse=await fetch(base+'/manifest.webmanifest');assert.equal(manifestResponse.headers.get('content-type'),'application/manifest+json');const manifest=await manifestResponse.json();assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./report-studio.html');
    const start=await (await fetch(base+'/report-studio.html')).text();assert(start.includes('const LOCAL_TOKEN='));
    for(const icon of manifest.icons){const image=await fetch(base+'/'+icon.src.replace('./',''));assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');const bytes=Buffer.from(await image.arrayBuffer());assert.equal(bytes.readUInt32BE(16),Number(icon.sizes.split('x')[0]));}
    const token = html.match(/const LOCAL_TOKEN="([a-f0-9]+)"/)[1];
    const request = {url:'https://example.com/v1/chat/completions',headers:{Authorization:'Bearer mock','Content-Type':'application/json','X-Unwanted':'ignored'},body:{model:'mock',messages:[]}};
    const post = (origin=base, session=token, body=request) => fetch(base+'/api',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'x-local-token':session},body:JSON.stringify(body)});
    assert.equal((await post('https://untrusted.example')).status,403);
    assert.equal((await post(base,'invalid')).status,403);
    assert.equal((await post(base,'é'.repeat(64))).status,403);
    assert.equal((await fetch(base+'/report-studio-settings.json')).status,404);
    assert.equal((await fetch(base+'/api',{method:'OPTIONS'})).status,404);
    assert.equal((await post(base,token,{...request,url:'http://external.example'})).status,400);
    const response=await post();assert.equal(response.status,200);assert.equal((await response.json()).choices[0].message.content,'ok');
    assert.equal(captured.options.headers.Authorization,'Bearer mock');assert.equal(captured.options.headers['X-Unwanted'],undefined);assert.equal(captured.options.redirect,'error');
    failure={code:'1300',message:'sensitive report or key'};
    const limited=await post();assert.equal(limited.status,429);
    assert.deepEqual(await limited.json(),{error:'Provider rejected request',code:'1300'});
    failure={code:'sensitive report or key',message:'sensitive report or key'};
    assert.deepEqual(await (await post()).json(),{error:'Provider rejected request'});
    console.log('PASS: local launcher serves HTML, validates origin and session, restricts files, validates endpoints and headers, forwards provider response.');
  } finally { await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
