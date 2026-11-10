import { digest, isObject } from './utils.mjs';

const RANK = { PASS: 0, ALLOW: 0, REVIEW: 1, INCONCLUSIVE: 2, NO_GO: 3, DENY: 3 };
/**
 * Release gate. Worst result wins: one NO_GO is never averaged away by passing reports.
 * Reports with no gate (e.g. imported matrix) are INCONCLUSIVE, never PASS.
 */
export function releaseGate(entries, { allowReview = false } = {}) {
  if (!Array.isArray(entries) || entries.length > 200) throw new Error('Provide 0..200 {name, report} entries');
  const rows = entries.map(({ name, report }) => {
    const gate = isObject(report) && typeof report.gate === 'string' && report.gate in RANK ? report.gate : 'INCONCLUSIVE';
    return { name, gate, evaluation: report?.evaluation ?? report?.mode ?? 'unknown', errors: report?.totals?.errors ?? report?.totals?.FAIL ?? 0 };
  });
  let worst = rows.length ? Math.max(...rows.map(r => RANK[r.gate])) : 2;
  if (worst === 1 && allowReview) worst = 0;
  const decision = worst === 0 ? 'GO' : worst === 1 ? 'REVIEW' : worst === 2 ? 'INCONCLUSIVE' : 'NO_GO';
  const blockers = rows.filter(r => RANK[r.gate] >= (allowReview ? 2 : 1)).map(r => r.name);
  return {
    schemaVersion: '0.2.0', mode: 'release-gate', evaluation: 'worst-result-wins', decision,
    gate: decision === 'GO' ? 'PASS' : decision, inputs: rows, blockers, inputDigest: digest(entries.map(e => e.report)),
    notice: 'Gate reflects only the supplied offline reports. GO is not a protocol conformance or security certification.'
  };
}
