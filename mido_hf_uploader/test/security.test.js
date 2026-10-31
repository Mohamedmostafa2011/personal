import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSession,authenticated,cookie,validOrigin} from '../lib/security.js';
import login from '../api/login.js';
import session from '../api/session.js';
import upload from '../api/upload.js';
process.env.SITE_PASSWORD='long-test-password'; process.env.SESSION_SECRET='a'.repeat(40);
function response(){return {headers:{},statusCode:0,setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(v){this.body=v;return this}}}
test('signed cookies authenticate and tampering fails',()=>{let s=makeSession();assert.equal(authenticated({headers:{cookie:`mido_session=${s}`}}),true);assert.equal(authenticated({headers:{cookie:`mido_session=${s}x`}}),false);assert.match(cookie(s,100),/HttpOnly; SameSite=Strict/)});
test('origin checking',()=>{assert.equal(validOrigin({headers:{origin:'https://example.com',host:'example.com'}}),true);assert.equal(validOrigin({headers:{origin:'https://evil.com',host:'example.com'}}),false)});
test('login and session',()=>{let res=response();login({method:'POST',headers:{origin:'https://example.com',host:'example.com'},body:{password:'long-test-password'}},res);assert.equal(res.statusCode,200);let r=response();session({method:'GET',headers:{cookie:res.headers['Set-Cookie']}},r);assert.equal(r.body.authenticated,true)});
test('upload refuses unauthenticated user',async()=>{let res=response();await upload({method:'POST',headers:{origin:'https://example.com',host:'example.com'}},res);assert.equal(res.statusCode,401)});

test('dashboard redirects anonymous users and serves authenticated HTML without filesystem access', async()=>{
  const {default: dashboard} = await import('../api/dashboard.js');
  function dashboardResponse(){const r=response();r.writeHead=function(code,headers){this.statusCode=code;Object.assign(this.headers,headers);return this};r.end=function(){return this};r.send=function(body){this.body=body;return this};return r;}
  let r=dashboardResponse();dashboard({method:'GET',headers:{}},r);assert.equal(r.statusCode,302);assert.equal(r.headers.Location,'/');
  r=dashboardResponse();dashboard({method:'GET',headers:{cookie:`mido_session=${makeSession()}`}},r);assert.equal(r.statusCode,200);assert.match(r.body,/<title>Uploader — Mido<\/title>/);assert.match(r.body,/\/js\/uploader\.js/);assert.match(r.headers['Content-Type'],/text\/html/);
});
