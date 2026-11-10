import {digest,isObject,sanitize} from './utils.mjs';
export function compatibilityMatrix(data){
 if(!isObject(data)||data.kind!=='protocolsutra-matrix-evidence'||!Array.isArray(data.entries)||data.entries.length>1000)throw new Error('Expected kind=protocolsutra-matrix-evidence and <=1000 entries');
 const grouped=new Map();
 for(const e of data.entries){
  if(!isObject(e)||!e.host||!e.protocol||!e.version)throw new Error('Each entry needs host, protocol and version');
  const key=[e.host,e.protocol,e.version].join('|');
  const observed=e.status==='pass'&&e.runId&&e.caseId?'reported-pass':e.status==='fail'?'reported-fail':e.status==='blocked'?'reported-blocked':'untested';
  const note=e.status==='pass'&&!e.runId?'No reproducible run ID linked; cannot prove compatibility.':(e.notes||'Imported evidence not independently verified');
  grouped.set(key,{host:e.host,protocol:e.protocol,version:e.version,status:observed,evidenceRef:e.runId&&e.caseId?`${e.runId}/${e.caseId}`:null,note:sanitize(note)});
 }
 return {schemaVersion:'0.1.0',mode:'imported-evidence-summary',evidenceDigest:digest(data),rows:[...grouped.values()].sort((a,b)=>a.host.localeCompare(b.host)||a.protocol.localeCompare(b.protocol)),notice:'A reported-pass is not independently verified; a full host compatibility claim requires a captured and checked live run.'};
}
