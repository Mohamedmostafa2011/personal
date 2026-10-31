import dashboardHtml from '../lib/dashboard-html.js';
import {authenticated,init,method} from '../lib/security.js';

export default function handler(req,res) {
  init(res);
  if (!method(req,res,'GET')) return;
  if (!authenticated(req)) { res.writeHead(302,{Location:'/'}); return res.end(); }
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.status(200).send(dashboardHtml);
}
