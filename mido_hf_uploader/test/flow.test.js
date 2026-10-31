import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import login from '../api/login.js';
import logout from '../api/logout.js';
import session from '../api/session.js';
import {createUploadHandler} from '../api/upload.js';

process.env.SITE_PASSWORD='test-password-not-production';
process.env.SESSION_SECRET='a-secure-test-key-that-is-long-enough-for-hmac';
process.env.HF_TOKEN='secret-test-token';
process.env.HF_REPO_ID='MidoSTM11/Mido';

function adapt(res) {
  res.status=n=>{res.statusCode=n;return res};
  res.json=obj=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(obj));return res};
  return res;
}
test('HTTP login, authenticated multipart upload, session, logout, and error handling', async t=>{
  let captured, fail=false;
  const handler=createUploadHandler(async args=>{captured=args;if(fail)throw Error('secret-test-token internal diagnostic');return {commitUrl:'https://huggingface.co/commit/test'}});
  const server=http.createServer(async (req,res)=>{
    adapt(res);
    if(req.url==='/api/login') { let body='';for await (const part of req) body+=part;try {req.body=JSON.parse(body)} catch {req.body={}} return login(req,res); }
    if(req.url==='/api/session')return session(req,res);
    if(req.url==='/api/logout')return logout(req,res);
    if(req.url==='/api/upload')return handler(req,res);
    res.status(404).json({error:'not found'});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>server.close());
  const base=`http://127.0.0.1:${server.address().port}`;
  const send=(path,opts={})=>fetch(base+path,{...opts,headers:{origin:base,...opts.headers}});
  let r=await send('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'wrong'})});assert.equal(r.status,401);assert.equal(r.headers.get('set-cookie'),null);
  r=await send('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:process.env.SITE_PASSWORD})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  r=await send('/api/session',{headers:{cookie}});assert.deepEqual(await r.json(),{authenticated:true});
  const form=()=>{let f=new FormData();f.append('file',new Blob(['hello world']), 'résumé & 100%.txt');return f};
  r=await send('/api/upload',{method:'POST',headers:{cookie},body:form()});assert.equal(r.status,200);const result=await r.json();assert.deepEqual(result,{filename:'résumé & 100%.txt',url:'https://huggingface.co/datasets/MidoSTM11/Mido/resolve/main/r%C3%A9sum%C3%A9%20%26%20100%25.txt'});assert.equal(captured.accessToken,process.env.HF_TOKEN);assert.deepEqual(captured.repo,{type:'dataset',name:process.env.HF_REPO_ID});assert.equal(captured.branch,'main');assert.equal(captured.file.path,result.filename);assert.equal(await captured.file.content.text(),'hello world');assert.ok(!JSON.stringify(result).includes(process.env.HF_TOKEN));
  fail=true;r=await send('/api/upload',{method:'POST',headers:{cookie},body:form()});assert.equal(r.status,502);assert.ok(!(await r.text()).includes(process.env.HF_TOKEN));
  r=await send('/api/logout',{method:'POST',headers:{cookie}});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
  r=await send('/api/session');assert.deepEqual(await r.json(),{authenticated:false});
  r=await send('/api/upload',{method:'POST',body:form()});assert.equal(r.status,401);
  r=await send('/api/upload',{method:'POST',headers:{cookie,origin:'https://evil.example'},body:form()});assert.equal(r.status,403);
});
