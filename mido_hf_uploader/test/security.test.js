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
