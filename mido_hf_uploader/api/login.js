import {configured, safeEqual, makeSession, cookie, TTL, validOrigin, init, method} from '../lib/security.js';
// Best-effort per-instance throttle. See README for distributed deployment limitations.
const attempts = new Map();
const WINDOW = 15 * 60 * 1000, LIMIT = 8;
export default function handler(req,res) {
  init(res); if (!method(req,res,'POST')) return;
  if (!validOrigin(req)) return res.status(403).json({error:'Request not allowed.'});
  if (!configured()) return res.status(503).json({error:'Service is not configured.'});
  const now = Date.now();
  for (const [key, v] of attempts) if (v.reset <= now) attempts.delete(key);
  // Vercel sets x-real-ip; rate limiting is only an additional, best-effort defense.
  const ip = String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown').slice(0,128);
  let entry = attempts.get(ip) || { count:0, reset:now+WINDOW };
  if (entry.count >= LIMIT) { res.setHeader('Retry-After', String(Math.ceil((entry.reset-now)/1000))); return res.status(429).json({error:'Too many attempts. Please try again later.'}); }
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length > 1024 || !safeEqual(password, process.env.SITE_PASSWORD)) {
    entry.count++; if (attempts.size < 10000 || attempts.has(ip)) attempts.set(ip, entry);
    return res.status(401).json({error:'Incorrect password.'});
  }
  attempts.delete(ip);
  res.setHeader('Set-Cookie', cookie(makeSession(), TTL));
  return res.status(200).json({ok:true});
}
