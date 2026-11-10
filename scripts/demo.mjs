import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSnapshot } from '../packages/core/validate.mjs';
import { replaySuite } from '../packages/core/replay.mjs';
import { compatibilityMatrix } from '../packages/core/matrix.mjs';
import { auditSecurity } from '../packages/core/audit.mjs';
import { diffSnapshots } from '../packages/core/diff.mjs';
import { evaluatePolicy } from '../packages/core/policy.mjs';
import { markdownReport, htmlReport } from '../packages/core/report.mjs';
import { sanitize } from '../packages/core/utils.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = async f => JSON.parse(await readFile(join(root, f), 'utf8'));
const jobs = [
  ['mcp-validation', async () => validateSnapshot(await load('fixtures/mcp/invalid.json'))],
  ['a2a-validation', async () => validateSnapshot(await load('fixtures/a2a/invalid.json'))],
  ['replay-passing', async () => replaySuite(await load('fixtures/replay/passing.json'))],
  ['replay-failing', async () => replaySuite(await load('fixtures/replay/failing.json'))],
  ['compatibility', async () => compatibilityMatrix(await load('fixtures/evidence/compatibility.json'))],
  ['security-audit-poisoned', async () => auditSecurity(await load('fixtures/audit/poisoned.json'))],
  ['security-audit-clean', async () => auditSecurity(await load('fixtures/audit/clean.json'))],
  ['contract-diff', async () => diffSnapshots(await load('fixtures/diff/v1.json'), await load('fixtures/diff/v2.json'))],
  ['policy-ssrf-denied', async () => evaluatePolicy(await load('fixtures/policy/policy.json'), await load('fixtures/policy/call-ssrf.json'))]
];
const output = join(root, 'examples', 'reports');
await mkdir(output, { recursive: true });
for (const [name, run] of jobs) {
  const x = sanitize(await run());
  await writeFile(join(output, `${name}.json`), JSON.stringify(x, null, 2) + '\n');
  await writeFile(join(output, `${name}.md`), markdownReport(x));
  await writeFile(join(output, `${name}.html`), htmlReport(x));
  console.log(`${name}: ${x.gate || 'IMPORTED'} (${x.findings?.length ?? x.cases?.length ?? x.rows?.length ?? x.reasons?.length ?? 0} items)`);
}
