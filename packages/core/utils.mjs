import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
/** Key-order independent JSON so equal documents always hash equally. */
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (isObject(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value === undefined ? null : value);
}
export const digest = value => createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex');
export function finding(rule, level, path, message, extra={}) {
  return {id: digest([rule, path, message]).slice(0,16),rule,level,path,message,...extra};
}
export function readJSON(input) { return readFile(resolve(input),'utf8').then(text=>JSON.parse(text)); }
export async function writeJSON(file, object) { await mkdir(dirname(resolve(file)),{recursive:true}); await writeFile(resolve(file),JSON.stringify(object,null,2)+'\n','utf8'); }
export function sanitize(value, depth=0) {
  if (depth>18) return '[MAX_DEPTH]';
  if (Array.isArray(value)) return value.slice(0,1000).map(x=>sanitize(x,depth+1));
  if (isObject(value)) {
    const safe={};
    for(const [key,v] of Object.entries(value)) {
      if (/^(token|secret|password|authorization|api[_-]?key|cookie|private[_-]?key|access[_-]?token)$/i.test(key)) safe[key]='[REDACTED]';
      else safe[key]=sanitize(v,depth+1);
    }
    return safe;
  }
  if(typeof value==='string') {
    return value.replace(/(Bearer\s+)[A-Za-z0-9._~+\/=-]{8,}/gi,'$1[REDACTED]')
      .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,'[REDACTED_PRIVATE_KEY]')
      .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|xox[abprs]-[A-Za-z0-9-]{10,}|npm_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g,'[REDACTED]')
      .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s:@\/]+:[^\s@\/]+@/gi,'$1[REDACTED]@')
      .slice(0,25000);
  }
  return value;
}
export function counts(items){const o={errors:0,warnings:0,info:0};for(const f of items)o[f.level==='error'?'errors':f.level==='warning'?'warnings':'info']++;return o;}
export function subset(expected,actual) {
 if(Array.isArray(expected))return Array.isArray(actual) && expected.length<=actual.length && expected.every((v,i)=>subset(v,actual[i]));
 if(isObject(expected))return isObject(actual)&&Object.entries(expected).every(([k,v])=>Object.hasOwn(actual,k)&&subset(v,actual[k]));
 return Object.is(expected,actual);
}
