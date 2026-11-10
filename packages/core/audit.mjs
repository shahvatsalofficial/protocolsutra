import { counts, digest, finding, isObject, sanitize } from './utils.mjs';

/**
 * Heuristic security audit of an MCP snapshot or A2A card.
 * Every rule is labelled HEURISTIC: a hit is a lead for human review, a miss is not proof of safety.
 */
const INJECTION = [
  ['TP_IGNORE_INSTRUCTIONS', /\b(ignore|disregard|forget|override)\b[^.]{0,40}\b(previous|prior|above|earlier|system|all)\b[^.]{0,30}\b(instruction|prompt|rule|message)s?/i, 'Description tries to override prior instructions'],
  ['TP_HIDDEN_DIRECTIVE', /<\s*(important|system|instructions?|secret)\s*>/i, 'Description contains a pseudo-system tag aimed at the model'],
  ['TP_EXFIL_DIRECTIVE', /\b(send|post|upload|forward|exfiltrat\w*|leak)\b[^.]{0,60}\b(to|at)\b[^.]{0,40}(https?:\/\/|\bmy server\b|\bemail\b)/i, 'Description instructs data to be sent elsewhere'],
  ['TP_SECRET_ACCESS', /\b(read|cat|open|access|include)\b[^.]{0,40}(~\/\.ssh|id_rsa|\.env\b|\.aws|credentials|private key|\/etc\/passwd)/i, 'Description steers the model toward secret files'],
  ['TP_CONCEAL', /\b(do not|don't|never)\b[^.]{0,30}\b(tell|mention|reveal|show|inform)\b[^.]{0,30}\b(user|human)/i, 'Description asks to conceal behaviour from the user']
];
const DANGEROUS_NAME = /(^|[_\-.])(exec|execute|shell|bash|sh|cmd|eval|run[_-]?command|sudo|rm|delete|drop|format|kill)([_\-.]|$)/i;
const ZERO_WIDTH = /[​-‏‪-‮⁠-⁤﻿]/;
const SECRET = /(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._~+\/=-]{16,})/;
const UNBOUNDED_PATHISH = /(^|_)(path|file|filename|command|cmd|script|url|uri|query|sql)$/i;

function textsOf(doc) {
  const out = [['name', doc.name], ['description', doc.description]];
  for (const [i, t] of (Array.isArray(doc.tools) ? doc.tools : []).entries()) {
    if (!isObject(t)) continue;
    out.push([`tools[${i}].name`, t.name], [`tools[${i}].description`, t.description], [`tools[${i}].title`, t.title]);
    for (const [k, v] of Object.entries(t.inputSchema?.properties ?? {})) out.push([`tools[${i}].inputSchema.properties.${k}.description`, v?.description]);
  }
  for (const [i, s] of (Array.isArray(doc.skills) ? doc.skills : []).entries()) if (isObject(s)) out.push([`skills[${i}].description`, s.description], [`skills[${i}].name`, s.name]);
  return out.filter(([, v]) => typeof v === 'string');
}

export function auditSecurity(doc) {
  const out = [];
  if (!isObject(doc) || !['mcp-snapshot', 'a2a-agent-card'].includes(doc.kind)) {
    out.push(finding('AUDIT_INPUT', 'error', '$', 'Expected kind mcp-snapshot or a2a-agent-card'));
  } else {
    for (const [path, text] of textsOf(doc)) {
      for (const [rule, re, msg] of INJECTION) if (re.test(text)) out.push(finding(rule, 'error', path, `${msg} (heuristic)`, { evidenceClass: 'heuristic' }));
      if (ZERO_WIDTH.test(text)) out.push(finding('TP_HIDDEN_UNICODE', 'error', path, 'Invisible/bidi control characters can hide instructions from reviewers', { evidenceClass: 'heuristic' }));
      if (text.length > 4000) out.push(finding('TP_OVERSIZED_TEXT', 'warning', path, `Text is ${text.length} chars; long descriptions can bury directives`, { evidenceClass: 'heuristic' }));
      if (SECRET.test(text)) out.push(finding('SECRET_IN_TEXT', 'error', path, 'Credential-like material present in snapshot text', { evidenceClass: 'heuristic' }));
    }
    if (doc.kind === 'mcp-snapshot') {
      for (const [i, t] of (Array.isArray(doc.tools) ? doc.tools : []).entries()) {
        if (!isObject(t)) continue;
        const p = `tools[${i}]`;
        if (typeof t.name === 'string' && DANGEROUS_NAME.test(t.name)) {
          const hinted = t.annotations?.destructiveHint === true;
          out.push(finding('TOOL_HIGH_IMPACT_NAME', hinted ? 'info' : 'warning', `${p}.name`, `Tool "${t.name}" looks high-impact; require an approval gate and deny-by-default policy`, { evidenceClass: 'heuristic' }));
        }
        if (t.annotations?.readOnlyHint === true && typeof t.name === 'string' && DANGEROUS_NAME.test(t.name)) out.push(finding('ANNOTATION_NAME_CONFLICT', 'warning', `${p}.annotations`, 'readOnlyHint=true conflicts with a high-impact tool name; annotations are untrusted', { evidenceClass: 'heuristic' }));
        for (const [k, v] of Object.entries(t.inputSchema?.properties ?? {})) {
          if (UNBOUNDED_PATHISH.test(k) && isObject(v) && v.type === 'string' && v.maxLength === undefined && v.pattern === undefined && v.enum === undefined && v.format === undefined)
            out.push(finding('SCHEMA_UNBOUNDED_STRING', 'warning', `${p}.inputSchema.properties.${k}`, `"${k}" is an unconstrained string; add maxLength/pattern/enum and enforce policy at the boundary`, { evidenceClass: 'heuristic' }));
        }
        if (t.inputSchema?.additionalProperties === undefined && isObject(t.inputSchema?.properties) && Object.keys(t.inputSchema.properties).length)
          out.push(finding('SCHEMA_ADDITIONAL_PROPERTIES', 'info', `${p}.inputSchema.additionalProperties`, 'additionalProperties not set to false; unexpected arguments may be accepted', { evidenceClass: 'heuristic' }));
      }
      if ((doc.tools?.length ?? 0) > 0 && doc.authorization === undefined && doc.authNotes === undefined)
        out.push(finding('AUTH_NOT_DOCUMENTED', 'info', 'authorization', 'No authorization model recorded; authentication does not imply authorization', { evidenceClass: 'heuristic' }));
    } else {
      if (!isObject(doc.securitySchemes) || !Object.keys(doc.securitySchemes).length) out.push(finding('A2A_NO_SECURITY_SCHEMES', 'warning', 'securitySchemes', 'Agent Card declares no security schemes', { evidenceClass: 'heuristic' }));
      for (const [i, v] of (Array.isArray(doc.supportedInterfaces) ? doc.supportedInterfaces : []).entries())
        if (isObject(v) && typeof v.url === 'string' && /^http:\/\//i.test(v.url) && !/^http:\/\/(127\.0\.0\.1|localhost)/i.test(v.url)) out.push(finding('A2A_PLAINTEXT_INTERFACE', 'error', `supportedInterfaces[${i}].url`, 'Remote interface uses plaintext HTTP', { evidenceClass: 'heuristic' }));
    }
  }
  const findings = out.sort((a, b) => a.path.localeCompare(b.path) || a.rule.localeCompare(b.rule));
  const totals = counts(findings);
  return {
    schemaVersion: '0.2.0', evaluation: 'offline-heuristic-security-audit', kind: doc?.kind ?? null, inputDigest: digest(doc),
    findings: sanitize(findings), totals, gate: totals.errors ? 'NO_GO' : totals.warnings ? 'REVIEW' : 'PASS',
    notice: 'Heuristic pattern audit of static text. Zero findings is not proof of safety; findings are leads for human review. No tool was executed.'
  };
}
