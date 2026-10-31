import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {authenticated,init,method} from '../lib/security.js';
export default async function handler(req,res) {
  init(res); if (!method(req,res,'GET')) return;
  if (!authenticated(req)) { res.writeHead(302,{Location:'/'}); return res.end(); }
  try { const html = await readFile(join(process.cwd(),'private/dashboard.html')); res.setHeader('Content-Type','text/html; charset=utf-8'); res.status(200).send(html); } catch { res.status(500).send('Unable to load dashboard.'); }
}
