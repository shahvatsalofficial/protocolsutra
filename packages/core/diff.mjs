import { counts, digest, finding, isObject } from './utils.mjs';

const typeOf = s => (isObject(s) ? s.type ?? null : null);
function diffSchema(before, after, path, out) {
  const bp = isObject(before?.properties) ? before.properties : {}, ap = isObject(after?.properties) ? after.properties : {};
  const breq = new Set(before?.required ?? []), areq = new Set(after?.required ?? []);
  for (const k of Object.keys(bp)) {
    if (!(k in ap)) out.push(finding('CONTRACT_PROPERTY_REMOVED', 'error', `${path}.properties.${k}`, `Input property "${k}" removed; callers sending it may break`));
    else {
      const bt = typeOf(bp[k]), at = typeOf(ap[k]);
      if (JSON.stringify(bt) !== JSON.stringify(at)) out.push(finding('CONTRACT_PROPERTY_TYPE_CHANGED', 'error', `${path}.properties.${k}.type`, `Type of "${k}" changed from ${JSON.stringify(bt)} to ${JSON.stringify(at)}`));
      const be = bp[k]?.enum, ae = ap[k]?.enum;
      if (Array.isArray(be) && Array.isArray(ae)) { const lost = be.filter(v => !ae.includes(v)); if (lost.length) out.push(finding('CONTRACT_ENUM_NARROWED', 'error', `${path}.properties.${k}.enum`, `Enum values removed: ${JSON.stringify(lost)}`)); }
      else if (be === undefined && Array.isArray(ae)) out.push(finding('CONTRACT_ENUM_ADDED', 'error', `${path}.properties.${k}.enum`, `"${k}" now restricted to an enum`));
    }
  }
  for (const k of Object.keys(ap)) if (!(k in bp)) out.push(finding(areq.has(k) ? 'CONTRACT_REQUIRED_ADDED' : 'CONTRACT_PROPERTY_ADDED', areq.has(k) ? 'error' : 'info', `${path}.properties.${k}`, areq.has(k) ? `New required input "${k}" breaks existing callers` : `Optional input "${k}" added (compatible)`));
  for (const k of areq) if (!breq.has(k) && k in bp) out.push(finding('CONTRACT_REQUIRED_ADDED', 'error', `${path}.required`, `Existing input "${k}" became required`));
  for (const k of breq) if (!areq.has(k) && k in ap) out.push(finding('CONTRACT_REQUIRED_RELAXED', 'info', `${path}.required`, `Input "${k}" no longer required (compatible)`));
}

/** Regression check between two saved reports: findings present now that were absent before. */
export function regression(previous, current) {
  for (const [n, r] of [['previous', previous], ['current', current]]) if (!isObject(r) || !Array.isArray(r.findings)) throw new Error(`"${n}" must be a report with a findings array`);
  const key = f => `${f.rule}@${f.path}`;
  const before = new Set(previous.findings.map(key)), now = new Set(current.findings.map(key));
  const out = [];
  for (const f of current.findings) if (!before.has(key(f)) && f.level !== 'info') out.push(finding('REGRESSION_NEW_FINDING', f.level === 'error' ? 'error' : 'warning', f.path, `New ${f.level}: ${f.rule} — ${f.message}`));
  const fixed = previous.findings.filter(f => !now.has(key(f))).length;
  const findings = out.sort((a, b) => a.path.localeCompare(b.path));
  const totals = counts(findings);
  return { schemaVersion: '0.2.0', evaluation: 'offline-regression', previousDigest: digest(previous), currentDigest: digest(current), fixedFindings: fixed, findings, totals, gate: totals.errors ? 'NO_GO' : totals.warnings ? 'REVIEW' : 'PASS', notice: 'Compares saved reports only; says nothing about behaviour that no report captured.' };
}

/** Semantic compatibility diff between two mcp-snapshot documents (old -> new). */
export function diffSnapshots(before, after) {
  for (const [n, d] of [['before', before], ['after', after]]) if (!isObject(d) || d.kind !== 'mcp-snapshot' || !Array.isArray(d.tools)) throw new Error(`"${n}" must be an mcp-snapshot with a tools array`);
  const out = [];
  if (before.protocolVersion !== after.protocolVersion) out.push(finding('VERSION_CHANGED', 'warning', 'protocolVersion', `Protocol version changed ${before.protocolVersion} -> ${after.protocolVersion}; re-run version-specific suites`));
  const bt = new Map(before.tools.map(t => [t?.name, t])), at = new Map(after.tools.map(t => [t?.name, t]));
  for (const [name, t] of bt) {
    if (!at.has(name)) { out.push(finding('TOOL_REMOVED', 'error', `tools.${name}`, `Tool "${name}" was removed`)); continue; }
    const n = at.get(name);
    diffSchema(t.inputSchema, n.inputSchema, `tools.${name}.inputSchema`, out);
    if (isObject(t.outputSchema) && !isObject(n.outputSchema)) out.push(finding('CONTRACT_OUTPUT_SCHEMA_REMOVED', 'error', `tools.${name}.outputSchema`, 'outputSchema removed'));
    if (t.annotations?.readOnlyHint === true && n.annotations?.readOnlyHint !== true) out.push(finding('ANNOTATION_READONLY_DROPPED', 'warning', `tools.${name}.annotations.readOnlyHint`, 'Tool no longer claims read-only; review behaviour change'));
    if (t.description !== n.description) out.push(finding('DESCRIPTION_CHANGED', 'info', `tools.${name}.description`, 'Description changed; re-audit for tool-poisoning (rug-pull) risk'));
  }
  for (const name of at.keys()) if (!bt.has(name)) out.push(finding('TOOL_ADDED', 'info', `tools.${name}`, `Tool "${name}" added`));
  const findings = out.sort((a, b) => a.path.localeCompare(b.path) || a.rule.localeCompare(b.rule));
  const totals = counts(findings);
  return {
    schemaVersion: '0.2.0', evaluation: 'offline-contract-diff', beforeDigest: digest(before), afterDigest: digest(after), findings, totals,
    gate: totals.errors ? 'NO_GO' : totals.warnings ? 'REVIEW' : 'PASS',
    notice: 'Structural diff of two captured snapshots. It does not observe runtime behaviour; semantic changes with unchanged schemas are invisible.'
  };
}
