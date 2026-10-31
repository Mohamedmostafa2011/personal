import {cookie,validOrigin,init,method} from '../lib/security.js';
export default function handler(req,res) { init(res); if (!method(req,res,'POST')) return; if (!validOrigin(req)) return res.status(403).json({error:'Request not allowed.'}); res.setHeader('Set-Cookie',cookie('',0)); res.status(200).json({ok:true}); }
