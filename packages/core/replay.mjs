import {counts,digest,finding,isObject,sanitize,subset} from './utils.mjs';
const idType = x => (typeof x==='string'||(typeof x==='number'&&Number.isFinite(x)));
export function validateRpcPair(request,response){
 const issues=[];
 if(!isObject(request)||request.jsonrpc!=='2.0'||!idType(request.id)||typeof request.method!=='string'||!request.method.length)issues.push(finding('RPC_REQUEST_INVALID','error','request','Request needs jsonrpc=2.0, an ID and a non-empty method'));
 if(response===null||response===undefined)return {issues,observed:'not-run'};
 if(!isObject(response)||response.jsonrpc!=='2.0'||!Object.is(response.id,request?.id)||Object.hasOwn(response,'result')===Object.hasOwn(response,'error'))issues.push(finding('RPC_RESPONSE_INVALID','error','response','Response needs matching ID, jsonrpc=2.0 and exactly one of result/error'));
 if(isObject(response)&&Object.hasOwn(response,'error') && (!isObject(response.error)||!Number.isInteger(response.error.code)||typeof response.error.message!=='string'))issues.push(finding('RPC_ERROR_INVALID','error','response.error','Error must contain integer code and string message'));
 return {issues,observed:isObject(response)&&Object.hasOwn(response,'error')?'error':'success'};
}
export function replaySuite(suite){
 if(!isObject(suite)||suite.kind!=='protocolsutra-replay-suite'||!Array.isArray(suite.cases)||suite.cases.length>500)throw new Error('Invalid replay suite; expected kind=protocolsutra-replay-suite and 0..500 cases');
 const result=[];
 const known=new Set();
 for(const [index,c] of suite.cases.entries()){
  const problems=[];
  if(!isObject(c)){result.push({id:`case-${index+1}`,status:'FAIL',findings:[finding('CASE_OBJECT','error',`cases[${index}]`,'Case must be object')]});continue;}
  const caseId=typeof c.id==='string'&&c.id?c.id:`case-${index+1}`;
  if(known.has(caseId))problems.push(finding('CASE_DUPLICATE','error','id',`Duplicate case ${caseId}`));
  known.add(caseId);
  const {issues,observed}=validateRpcPair(c.request,c.response);problems.push(...issues);
  let status='PASS';
  if(!isObject(c.expect)||!['success','error','denied'].includes(c.expect.outcome))problems.push(finding('EXPECTATION_MISSING','error','expect.outcome','Expected outcome must be success, error or denied'));
  if(observed==='not-run'){status='INCONCLUSIVE';problems.push(finding('NO_OBSERVATION','warning','response','No recorded response; cannot mark passing'))}
  if(c.expect?.outcome && observed!=='not-run'){
    const desired=c.expect.outcome==='denied'?'error':c.expect.outcome;
    if(observed!==desired)problems.push(finding('OUTCOME_MISMATCH','error','response',`Expected ${c.expect.outcome}, recorded ${observed}`));
  }
  const attemptedTool=c.request?.method==='tools/call'?c.request?.params?.name:null;
  const restricted=Array.isArray(c.policy?.allowedTools)&&attemptedTool&&!c.policy.allowedTools.includes(attemptedTool);
  if(restricted && observed==='success')problems.push(finding('PERMISSION_BYPASS','error','response',`Recorded response succeeded for disallowed tool ${attemptedTool}`));
  if(c.expect?.outcome==='denied'&&!restricted)problems.push(finding('DENIAL_CONTEXT_MISSING','warning','policy.allowedTools','Denied case lacks evidence of a denied tool policy'));
  if(Object.hasOwn(c.expect||{},'resultSubset')&&observed==='success'&&!subset(c.expect.resultSubset,c.response?.result))problems.push(finding('RESULT_MISMATCH','error','response.result','Observed result did not contain expected fields'));
  if(Object.hasOwn(c.expect||{},'errorCode')&&observed==='error'&&c.response?.error?.code!==c.expect.errorCode)problems.push(finding('ERROR_CODE_MISMATCH','error','response.error.code',`Expected error code ${c.expect.errorCode}`));
  if(problems.some(x=>x.level==='error'))status='FAIL';
  result.push({id:caseId,protocol:c.protocol||'unspecified',requestMethod:c.request?.method||'unknown',status,findings:problems,observed,source:'imported-recording; not live executed'});
 }
 const totals={PASS:result.filter(x=>x.status==='PASS').length,FAIL:result.filter(x=>x.status==='FAIL').length,INCONCLUSIVE:result.filter(x=>x.status==='INCONCLUSIVE').length};
 return {schemaVersion:'0.1.0',suiteName:suite.name||'unnamed',suiteDigest:digest(suite),mode:'offline-recorded-replay',scope:'Recorded JSON-RPC shape, expected results and declared local policy only',cases:result,totals,gate:totals.FAIL?'NO_GO':totals.INCONCLUSIVE||result.length===0?'INCONCLUSIVE':'PASS',notice:'Replay evaluates imported records: it does not invoke actual MCP/A2A hosts and does not prove full protocol conformance.'};
}
