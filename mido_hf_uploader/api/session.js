import {authenticated,init,method} from '../lib/security.js';
export default function handler(req,res) { init(res); if (!method(req,res,'GET')) return; res.status(200).json({authenticated:authenticated(req)}); }
