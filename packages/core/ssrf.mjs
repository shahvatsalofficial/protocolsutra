import { isIP } from 'node:net';

/**
 * Static (no DNS) URL screening for outbound targets. Offline by design:
 * a hostname that merely *resolves* to a private IP must still be handled by a
 * future resolver-aware runner (DNS-rebinding defence); this check is the first gate.
 */
function ipv4Private(ip) {
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
function ipv6Private(ip) {
  const x = ip.toLowerCase().replace(/^\[|\]$/g, '');
  const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Private(mapped[1]);
  const hex = x.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/); // WHATWG URL normalises mapped IPv4 to hex form
  if (hex) { const hi = parseInt(hex[1], 16), lo = parseInt(hex[2], 16); return ipv4Private(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`); }
  return x === '::1' || x === '::' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x);
}
/** Returns {allowed, reasons[]}. allowHosts = explicit exact-host allowlist (required for non-loopback). */
export function checkUrl(raw, { allowHosts = [], allowLoopback = false, requireHttps = true } = {}) {
  const reasons = [];
  let u;
  try { u = new URL(raw); } catch { return { allowed: false, reasons: ['URL_INVALID'] }; }
  if (!['http:', 'https:'].includes(u.protocol)) reasons.push('URL_SCHEME_FORBIDDEN');
  if (u.username || u.password) reasons.push('URL_CREDENTIALS_EMBEDDED');
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const kind = isIP(host);
  const loopback = host === 'localhost' || host.endsWith('.localhost') || host === '::1' || (kind === 4 && host.startsWith('127.'));
  const metadata = host === '169.254.169.254' || host === 'metadata.google.internal' || host === 'fd00:ec2::254';
  if (metadata) reasons.push('URL_CLOUD_METADATA');
  else if (loopback) { if (!allowLoopback) reasons.push('URL_LOOPBACK_FORBIDDEN'); }
  else if ((kind === 4 && ipv4Private(host)) || (kind === 6 && ipv6Private(host))) reasons.push('URL_PRIVATE_ADDRESS');
  else if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) reasons.push('URL_NUMERIC_HOST_OBFUSCATION');
  else if (host.endsWith('.internal') || host.endsWith('.local')) reasons.push('URL_INTERNAL_SUFFIX');
  if (requireHttps && u.protocol === 'http:' && !(loopback && allowLoopback)) reasons.push('URL_NOT_HTTPS');
  if (!loopback && !allowHosts.map(h => h.toLowerCase()).includes(host)) reasons.push('URL_HOST_NOT_ALLOWLISTED');
  return { allowed: reasons.length === 0, reasons, host };
}
