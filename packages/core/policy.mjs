import { digest, isObject } from './utils.mjs';
import { checkUrl } from './ssrf.mjs';

export const DEFAULT_POLICY = Object.freeze({
  kind: 'protocolsutra-policy',
  allowedTools: [],      // empty = nothing allowed (deny by default)
  deniedTools: [],       // always wins over allowedTools
  allowedHosts: [],
  allowLoopback: false,
  pathRoots: [],         // string args that look like paths must stay under one of these
  maxArgumentBytes: 65536
});

const PATH_KEY = /(^|_|-)(path|file|filename|dir|directory|folder|cwd)s?$/i;
function* walk(value, key = '') {
  if (typeof value === 'string') yield [key, value];
  else if (Array.isArray(value)) for (const v of value) yield* walk(v, key);
  else if (isObject(value)) for (const [k, v] of Object.entries(value)) yield* walk(v, k);
}
function normalize(p) {
  const parts = [];
  for (const seg of p.replace(/\\/g, '/').split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { if (!parts.length) return null; parts.pop(); } else parts.push(seg);
  }
  return '/' + parts.join('/');
}

/**
 * Deterministic decision at the execution boundary. Tool self-description
 * (annotations such as readOnlyHint) is never an input here.
 */
export function evaluatePolicy(policy, call) {
  if (!isObject(policy) || policy.kind !== 'protocolsutra-policy') throw new Error('Expected policy with kind=protocolsutra-policy');
  if (!isObject(call) || typeof call.tool !== 'string' || !call.tool) throw new Error('Call needs a non-empty "tool" string');
  const p = { ...DEFAULT_POLICY, ...policy };
  const reasons = [];
  if (p.deniedTools.includes(call.tool)) reasons.push('TOOL_EXPLICITLY_DENIED');
  else if (!p.allowedTools.includes(call.tool)) reasons.push('TOOL_NOT_ALLOWLISTED');
  const args = call.arguments ?? {};
  if (Buffer.byteLength(JSON.stringify(args)) > p.maxArgumentBytes) reasons.push('ARGUMENTS_TOO_LARGE');
  for (const [key, val] of walk(args)) {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(val)) {
      const r = checkUrl(val, { allowHosts: p.allowedHosts, allowLoopback: p.allowLoopback });
      for (const x of r.reasons) reasons.push(`${x}:${key || 'value'}`);
    } else if (PATH_KEY.test(key) || /(^|[\\/])\.\.([\\/]|$)/.test(val)) {
      if (val.includes('\0')) reasons.push(`PATH_NUL_BYTE:${key}`);
      const hasDots = /(^|[\\/])\.\.([\\/]|$)/.test(val);
      const norm = normalize(val.replace(/^[a-z]:/i, ''));
      const absolute = /^([\\/]|[a-z]:[\\/])/i.test(val);
      if (norm === null || (hasDots && !p.pathRoots.length)) reasons.push(`PATH_TRAVERSAL:${key}`);
      else if (p.pathRoots.length) {
        const roots = p.pathRoots.map(r => normalize(r.replace(/^[a-z]:/i, '')));
        if (!absolute || !roots.some(r => r && (norm === r || norm.startsWith(r === '/' ? '/' : r + '/')))) reasons.push(`PATH_OUTSIDE_ROOTS:${key}`);
      }
    }
  }
  const decision = reasons.length ? 'DENY' : 'ALLOW';
  return { schemaVersion: '0.2.0', mode: 'policy-evaluation', decision, gate: decision === 'ALLOW' ? 'PASS' : 'NO_GO', tool: call.tool, reasons, policyDigest: digest(policy), callDigest: digest(call), notice: 'Deterministic local policy decision. Tool annotations were ignored. Not a sandbox.' };
}
