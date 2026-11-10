import {counts,digest,finding,isObject,sanitize} from './utils.mjs';
const versionSupported={mcp:['2026-07-28','2025-11-25','2025-06-18'],a2a:['1.0','1.0.0','0.3.0']};
function textField(o,key){return typeof o?.[key]==='string'&&o[key].trim().length>0;}
function jsonSchemaChecks(schema,path,out){
 if(!isObject(schema)){out.push(finding('SCHEMA_OBJECT','error',path,'Schema must be an object'));return;}
 if(schema.type!=='object') out.push(finding('SCHEMA_ROOT_TYPE','error',path+'.type','Tool input schema must declare type: object'));
 if(schema.properties!==undefined&&!isObject(schema.properties))out.push(finding('SCHEMA_PROPERTIES','error',path+'.properties','properties must be an object'));
 if(schema.required!==undefined&&(!Array.isArray(schema.required)||!schema.required.every(x=>typeof x==='string')))out.push(finding('SCHEMA_REQUIRED','error',path+'.required','required must be a string array'));
 if(Array.isArray(schema.required)&&isObject(schema.properties))for(const k of schema.required)if(!Object.hasOwn(schema.properties,k))out.push(finding('SCHEMA_UNDECLARED_REQUIRED','warning',path+'.required',`Required field ${k} has no declared property schema`));
}
function validateMcp(doc,out){
 if(!textField(doc,'protocolVersion'))out.push(finding('MCP_VERSION_MISSING','error','protocolVersion','Specify an MCP protocol version explicitly'));
 else if(!versionSupported.mcp.includes(doc.protocolVersion))out.push(finding('MCP_VERSION_UNTESTED','warning','protocolVersion',`Version ${doc.protocolVersion} has no local fixture profile: structural checks only`));
 if(!textField(doc,'name'))out.push(finding('MCP_NAME','error','name','Snapshot needs a non-empty server name'));
 if(!isObject(doc.capabilities))out.push(finding('MCP_CAPABILITIES','warning','capabilities','Capabilities not supplied; tool availability cannot be checked fully'));
 if(!Array.isArray(doc.tools))out.push(finding('MCP_TOOLS','error','tools','MCP snapshot requires tools array from tools/list or an explicit empty array'));
 else {
   if(doc.tools.length>500)out.push(finding('MCP_TOO_MANY_TOOLS','error','tools','Snapshot exceeds tool count safety limit (500)'));
   if(doc.tools.length>0 && !isObject(doc.capabilities?.tools))out.push(finding('MCP_TOOLS_CAPABILITY','warning','capabilities.tools','Tools listed but tools capability not explicitly recorded'));
   const known=new Set();
   for(const [i,t] of doc.tools.slice(0,500).entries()){
    const p=`tools[${i}]`;
    if(!isObject(t)){out.push(finding('MCP_TOOL_OBJECT','error',p,'Each tool must be an object'));continue;}
    if(!textField(t,'name'))out.push(finding('MCP_TOOL_NAME','error',p+'.name','Tool name missing or empty'));
    else if(known.has(t.name))out.push(finding('MCP_TOOL_DUPLICATE','error',p+'.name',`Duplicate tool name ${t.name}`));
    else known.add(t.name);
    jsonSchemaChecks(t.inputSchema,p+'.inputSchema',out);
    if(t.outputSchema!==undefined&&!isObject(t.outputSchema))out.push(finding('MCP_OUTPUT_SCHEMA','error',p+'.outputSchema','outputSchema must be an object when present'));
    if(!textField(t,'description'))out.push(finding('MCP_TOOL_DESCRIPTION','warning',p+'.description','No description; agent selection may be less reliable'));
    if(t.annotations?.readOnlyHint===true)out.push(finding('MCP_ANNOTATION_UNTRUSTED','info',p+'.annotations.readOnlyHint','Read-only hint is advisory; do not treat as authorization proof'));
   }
 }
 if(doc.authorization?.token || doc.authorization?.password)out.push(finding('MCP_SECRET_IN_SNAPSHOT','error','authorization','Credential material should not be captured in a shareable snapshot'));
}
function validateA2a(doc,out){
 if(!textField(doc,'name'))out.push(finding('A2A_NAME','error','name','Agent Card name is required'));
 if(!textField(doc,'version'))out.push(finding('A2A_AGENT_VERSION','error','version','Agent version is required'));
 if(!textField(doc,'description'))out.push(finding('A2A_DESCRIPTION','warning','description','Agent Card should explain supported capabilities'));
 const proto=doc.protocolVersion||'not specified';
 if(!doc.protocolVersion)out.push(finding('A2A_VERSION_UNKNOWN','warning','protocolVersion','Protocol version not explicit; this cannot establish 1.0 compliance'));
 else if(!versionSupported.a2a.includes(doc.protocolVersion))out.push(finding('A2A_VERSION_UNTESTED','warning','protocolVersion',`Unprofiled A2A version ${proto}`));
 const interfaces=Array.isArray(doc.supportedInterfaces)?doc.supportedInterfaces:[];
 if(interfaces.length===0)out.push(finding('A2A_INTERFACES','error','supportedInterfaces','Agent Card needs at least one declared supported interface for this v1 profile'));
 for(const [i,v] of interfaces.entries()){
   if(!isObject(v)||!textField(v,'url'))out.push(finding('A2A_INTERFACE_URL','error',`supportedInterfaces[${i}].url`,'Interface requires a URL'));
   if(!isObject(v)||!textField(v,'protocolBinding'))out.push(finding('A2A_INTERFACE_BINDING','error',`supportedInterfaces[${i}].protocolBinding`,'Protocol binding required'));
   if(isObject(v)&&textField(v,'url')&&!/^https:\/\//.test(v.url)&&!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(v.url))out.push(finding('A2A_INTERFACE_SCHEME','warning',`supportedInterfaces[${i}].url`,'Non-HTTPS remote interface; consider TLS and authorization'));
 }
 if(!Array.isArray(doc.skills))out.push(finding('A2A_SKILLS','error','skills','skills array is required for this profile'));
 else {
  const seen=new Set();
  for(const [i,s] of doc.skills.entries()){
   if(!isObject(s)||!textField(s,'id'))out.push(finding('A2A_SKILL_ID','error',`skills[${i}].id`,'Skill ID required'));
   else if(seen.has(s.id))out.push(finding('A2A_DUPLICATE_SKILL','error',`skills[${i}].id`,`Duplicate skill ID ${s.id}`));
   else seen.add(s.id);
   if(!isObject(s)||!textField(s,'name'))out.push(finding('A2A_SKILL_NAME','error',`skills[${i}].name`,'Skill name required'));
  }
 }
 if(doc.securitySchemes!==undefined&&!isObject(doc.securitySchemes))out.push(finding('A2A_SECURITY_SCHEMES','error','securitySchemes','securitySchemes must be an object'));
}
export function validateSnapshot(doc){
 const out=[];
 if(!isObject(doc))out.push(finding('ROOT_OBJECT','error','$','Input must be a JSON object'));
 else if(doc.kind==='mcp-snapshot')validateMcp(doc,out);
 else if(doc.kind==='a2a-agent-card')validateA2a(doc,out);
 else out.push(finding('KIND_UNKNOWN','error','kind','Expected kind: mcp-snapshot or a2a-agent-card. The MCP snapshot is a ProtocolSutra capture format, NOT a normative MCP wire message.'));
 const findings=out.sort((a,b)=>a.path.localeCompare(b.path)||a.rule.localeCompare(b.rule));
 const totals=counts(findings);
 return {schemaVersion:'0.1.0',evaluation:'offline-structural-profile',specificationConformance:'not-assessed',kind:doc?.kind||null,protocolVersion:doc?.protocolVersion||'unknown',inputDigest:digest(doc),findings,totals,gate:totals.errors?'NO_GO':totals.warnings?'REVIEW':'PASS',notice:'Structural snapshot checks are a bounded subset, not full MCP/A2A protocol certification.'};
}
