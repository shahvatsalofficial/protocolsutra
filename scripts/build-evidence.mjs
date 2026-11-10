// Produces reproducible evidence: test results + labelled-corpus precision/recall + environment.
// Everything reported is measured by this script on this machine; nothing is hand-typed.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { auditSecurity } from '../packages/core/audit.mjs';
import { evaluatePolicy } from '../packages/core/policy.mjs';
import { checkUrl } from '../packages/core/ssrf.mjs';
import { digest } from '../packages/core/utils.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'documents', 'protocolsutra', 'evidence');
await mkdir(outDir, { recursive: true });
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

// 1. test run
const t0 = Date.now();
const run = spawnSync(process.execPath, [join(root, 'scripts/run-tests.mjs')], { cwd: root, encoding: 'utf8' });
const out = run.stdout + run.stderr;
const num = k => Number((out.match(new RegExp(`ℹ ${k} (\\d+)`)) || [])[1] ?? NaN);
const tests = { total: num('tests'), pass: num('pass'), fail: num('fail'), skipped: num('skipped'), exitCode: run.status, durationMs: Date.now() - t0 };

// 2. labelled corpus
const corpus = JSON.parse(await readFile(join(root, 'fixtures/benchmark/audit-corpus.json'), 'utf8'));
const results = corpus.cases.map(c => {
  const r = auditSecurity({ kind: 'mcp-snapshot', name: 'bench', tools: [{ name: 'tool', description: c.text, inputSchema: { type: 'object' } }] });
  const flagged = r.findings.some(f => f.level === 'error' && /^(TP_|SECRET_IN_TEXT)/.test(f.rule));
  return { id: c.id, malicious: c.malicious, flagged, rules: r.findings.filter(f => /^(TP_|SECRET_IN_TEXT)/.test(f.rule)).map(f => f.rule) };
});
const tp = results.filter(r => r.malicious && r.flagged).length, fn = results.filter(r => r.malicious && !r.flagged).length;
const fp = results.filter(r => !r.malicious && r.flagged).length, tn = results.filter(r => !r.malicious && !r.flagged).length;
const ratio = (a, b) => (b ? Math.round((a / b) * 1000) / 1000 : null);
const wilson = (k, n) => { if (!n) return null; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.round((c - m) / d * 1000) / 1000, Math.round((c + m) / d * 1000) / 1000]; };
const benchmark = {
  task: corpus.task, labeling: corpus.labeling, corpusDigest: digest(corpus), n: results.length,
  confusion: { tp, fn, fp, tn }, precision: ratio(tp, tp + fp), recall: ratio(tp, tp + fn), recall95CI: wilson(tp, tp + fn), falsePositiveRate: ratio(fp, fp + tn),
  misses: results.filter(r => r.malicious && !r.flagged).map(r => r.id), falseAlarms: results.filter(r => !r.malicious && r.flagged).map(r => r.id),
  caveat: 'Small hand-labelled synthetic corpus. Intervals are wide. Detection is regex-based and an adaptive attacker can evade it. Do not extrapolate to real-world accuracy.'
};

// 3. boundary self-checks (deterministic, adversarial)
const policy = { kind: 'protocolsutra-policy', allowedTools: ['read'], pathRoots: ['/workspace'], allowedHosts: ['api.example.com'] };
const attacks = [
  ['path traversal ../', { tool: 'read', arguments: { path: '/workspace/../etc/passwd' } }],
  ['windows traversal', { tool: 'read', arguments: { path: '..\\..\\windows' } }],
  ['sibling-prefix path', { tool: 'read', arguments: { path: '/workspace-evil/x' } }],
  ['relative path escaping roots', { tool: 'read', arguments: { path: 'secret.txt' } }],
  ['cloud metadata URL', { tool: 'read', arguments: { url: 'http://169.254.169.254/' } }],
  ['loopback URL', { tool: 'read', arguments: { url: 'https://127.0.0.1/' } }],
  ['private IPv4 URL', { tool: 'read', arguments: { url: 'https://10.1.2.3/' } }],
  ['decimal-encoded loopback', { tool: 'read', arguments: { url: 'https://2130706433/' } }],
  ['IPv4-mapped IPv6 private', { tool: 'read', arguments: { url: 'https://[::ffff:10.0.0.1]/' } }],
  ['credentials in URL', { tool: 'read', arguments: { url: 'https://a:b@api.example.com/' } }],
  ['unlisted tool', { tool: 'write', arguments: {} }],
  ['file:// scheme', { tool: 'read', arguments: { url: 'file:///etc/passwd' } }]
];
const attackResults = attacks.map(([name, call]) => ({ attack: name, decision: evaluatePolicy(policy, call).decision }));
const legit = [{ tool: 'read', arguments: { path: '/workspace/a.txt' } }, { tool: 'read', arguments: { url: 'https://api.example.com/v1' } }].map(c => evaluatePolicy(policy, c).decision);
const boundary = { attacks: attackResults, blocked: attackResults.filter(a => a.decision === 'DENY').length, total: attackResults.length, legitimateAllowed: legit.filter(d => d === 'ALLOW').length, legitimateTotal: legit.length, urlOnlyChecks: checkUrl('https://api.example.com/', { allowHosts: ['api.example.com'] }).allowed };

const evidence = {
  generatedBy: 'scripts/build-evidence.mjs', product: 'ProtocolSutra AI', version: pkg.version,
  environment: { node: process.version, platform: process.platform, arch: process.arch, osRelease: os.release(), cpus: os.cpus().length },
  tests, benchmark, boundary,
  honesty: ['Measured on one machine; CI results for Linux/macOS are published separately by GitHub Actions.', 'No live MCP/A2A server was contacted. Structural profiles are not protocol conformance.', 'Benchmark is small and synthetic.']
};
await writeFile(join(outDir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');

const md = `# Evidence — ProtocolSutra AI ${pkg.version}

Generated by \`npm run evidence\` (\`scripts/build-evidence.mjs\`). Re-run it to reproduce every number below.

## Environment
Node ${evidence.environment.node} · ${evidence.environment.platform}/${evidence.environment.arch} · ${evidence.environment.cpus} CPUs

## Automated tests
| Total | Pass | Fail | Skipped | Duration |
|---|---|---|---|---|
| ${tests.total} | ${tests.pass} | ${tests.fail} | ${tests.skipped} | ${(tests.durationMs / 1000).toFixed(1)} s |

## Tool-poisoning detection on a labelled corpus (n=${benchmark.n})
| Metric | Value |
|---|---|
| True positives / false negatives | ${tp} / ${fn} |
| False positives / true negatives | ${fp} / ${tn} |
| Precision | ${benchmark.precision} |
| Recall | ${benchmark.recall} (95% Wilson CI ${benchmark.recall95CI?.join('–')}) |
| False-positive rate | ${benchmark.falsePositiveRate} |
| Missed (malicious, not flagged) | ${benchmark.misses.join(', ') || 'none'} |
| False alarms (benign, flagged) | ${benchmark.falseAlarms.join(', ') || 'none'} |

Corpus digest: \`${benchmark.corpusDigest}\`

> ${benchmark.caveat}

## Policy / SSRF boundary self-checks
${boundary.blocked} of ${boundary.total} adversarial calls denied; ${boundary.legitimateAllowed} of ${boundary.legitimateTotal} legitimate calls allowed.

| Attack | Decision |
|---|---|
${attackResults.map(a => `| ${a.attack} | ${a.decision} |`).join('\n')}

## Honesty notes
${evidence.honesty.map(h => `- ${h}`).join('\n')}
`;
await writeFile(join(outDir, 'evidence.md'), md);
console.log(md);
if (tests.fail || run.status !== 0 || boundary.blocked !== boundary.total || boundary.legitimateAllowed !== boundary.legitimateTotal) process.exitCode = 1;
