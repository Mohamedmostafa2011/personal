import crypto from 'node:crypto';

const COOKIE = 'mido_session';
const TTL = 60 * 60 * 8;
const mac = (value, secret) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
export function configured() {
  return Boolean(process.env.SITE_PASSWORD && process.env.SESSION_SECRET && Buffer.byteLength(process.env.SESSION_SECRET) >= 32);
}
export function safeEqual(a, b) {
  const hash = s => crypto.createHash('sha256').update(s).digest();
  return crypto.timingSafeEqual(hash(a), hash(b));
}
export function makeSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000) + TTL, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  return `${payload}.${mac(payload, process.env.SESSION_SECRET)}`;
}
export function authenticated(req) {
  if (!configured()) return false;
  const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='));
  if (!cookie || cookie.length > 2048) return false;
  const [payload, signature, extra] = cookie.slice(COOKIE.length + 1).split('.');
  if (!payload || !signature || extra || !safeEqual(signature, mac(payload, process.env.SESSION_SECRET))) return false;
  try { const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); return Number.isSafeInteger(data.exp) && data.exp > Math.floor(Date.now()/1000); } catch { return false; }
}
export function cookie(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
export function validOrigin(req) {
  // Browser requests include Origin. Refuse missing origins for state-changing operations.
  try { const origin = new URL(req.headers.origin); return origin.host === req.headers.host && ['https:', 'http:'].includes(origin.protocol) && (process.env.NODE_ENV !== 'production' || origin.protocol === 'https:'); } catch { return false; }
}
export function init(res) { res.setHeader('Cache-Control', 'no-store'); }
export function method(req, res, expected) { if (req.method !== expected) { res.setHeader('Allow', expected); res.status(405).json({error:'Method not allowed.'}); return false; } return true; }
export { TTL };
