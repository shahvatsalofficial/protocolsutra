import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as ps from '../packages/core/index.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fx = async f => JSON.parse(await readFile(join(root, 'fixtures', f), 'utf8'));
const cli = args => spawnSync(process.execPath, [join(root, 'packages/cli/index.mjs'), ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, PROTOCOLSUTRA_SIGNING_KEY: '' } });
const rules = r => r.findings.map(f => f.rule);

// ---------- canonical digest
test('digest ignores key order', () => assert.equal(ps.digest({ a: 1, b: { c: 2, d: 3 } }), ps.digest({ b: { d: 3, c: 2 }, a: 1 })));
test('digest differs when value differs', () => assert.notEqual(ps.digest({ a: 1 }), ps.digest({ a: 2 })));

// ---------- redaction
for (const [name, secret, needle] of [
  ['aws key', 'AKIAABCDEFGHIJKLMNOP', 'AKIAABCDEFGHIJKLMNOP'],
  ['github oauth token', 'gho_abcdefghijklmnop1234', 'abcdefghijklmnop1234'],
  ['jwt', 'eyJhbGciOiJIUzI1.eyJzdWIiOiIxMjM0NTY.abcdefghijk123', 'abcdefghijk123'],
  ['url credentials', 'https://user:hunter2pw@host.example.invalid/x', 'hunter2pw'],
  ['private key block', '-----BEGIN RSA PRIVATE KEY-----\nMIIabcSECRETBODY\n-----END RSA PRIVATE KEY-----', 'MIIabcSECRETBODY'],
  ['npm token', 'npm_abcdefghijklmnopqrstuvwx', 'abcdefghijklmnopqrstuvwx']
]) test(`sanitize redacts ${name}`, () => assert.ok(!JSON.stringify(ps.sanitize({ note: `x ${secret} y` })).includes(needle)));
test('sanitize is idempotent', () => { const a = ps.sanitize({ t: 'Bearer abcdefghijklmnop' }); assert.deepEqual(ps.sanitize(a), a); });

// ---------- SSRF
for (const [url, reason] of [
  ['http://169.254.169.254/x', 'URL_CLOUD_METADATA'], ['http://10.0.0.5/', 'URL_PRIVATE_ADDRESS'], ['https://192.168.1.2/', 'URL_PRIVATE_ADDRESS'],
  ['https://[::1]/', 'URL_LOOPBACK_FORBIDDEN'], ['https://[fd00::1]/', 'URL_PRIVATE_ADDRESS'], ['https://[::ffff:10.0.0.1]/', 'URL_PRIVATE_ADDRESS'],
  ['file:///etc/passwd', 'URL_SCHEME_FORBIDDEN'], ['https://u:p@a.example/', 'URL_CREDENTIALS_EMBEDDED'], ['https://2130706433/', 'URL_LOOPBACK_FORBIDDEN'], ['https://0x7f.1/', 'URL_LOOPBACK_FORBIDDEN'],
  ['https://svc.internal/', 'URL_INTERNAL_SUFFIX'], ['https://unlisted.example/', 'URL_HOST_NOT_ALLOWLISTED'], ['not a url', 'URL_INVALID']
]) test(`ssrf blocks ${url}`, () => { const r = ps.checkUrl(url, { allowHosts: ['ok.example'] }); assert.equal(r.allowed, false); assert.ok(r.reasons.includes(reason), r.reasons.join()); });
test('ssrf allows allowlisted https host', () => assert.equal(ps.checkUrl('https://ok.example/a', { allowHosts: ['ok.example'] }).allowed, true));
test('ssrf loopback only when explicitly allowed', () => { assert.equal(ps.checkUrl('http://127.0.0.1:8080/').allowed, false); assert.equal(ps.checkUrl('http://127.0.0.1:8080/', { allowLoopback: true }).allowed, true); });

// ---------- policy
test('policy allows allowlisted call inside root', async () => assert.equal(ps.evaluatePolicy(await fx('policy/policy.json'), await fx('policy/call-allowed.json')).decision, 'ALLOW'));
test('policy blocks path traversal', async () => assert.equal(ps.evaluatePolicy(await fx('policy/policy.json'), await fx('policy/call-traversal.json')).decision, 'DENY'));
test('policy blocks SSRF argument', async () => assert.ok(ps.evaluatePolicy(await fx('policy/policy.json'), await fx('policy/call-ssrf.json')).reasons.some(r => r.startsWith('URL_CLOUD_METADATA'))));
test('policy denies by default (empty allowlist)', () => assert.equal(ps.evaluatePolicy({ kind: 'protocolsutra-policy' }, { tool: 'x' }).decision, 'DENY'));
test('denied list beats allowed list', () => assert.ok(ps.evaluatePolicy({ kind: 'protocolsutra-policy', allowedTools: ['x'], deniedTools: ['x'] }, { tool: 'x' }).reasons.includes('TOOL_EXPLICITLY_DENIED')));
test('policy ignores tool annotations', () => assert.equal(ps.evaluatePolicy({ kind: 'protocolsutra-policy', allowedTools: [] }, { tool: 'x', annotations: { readOnlyHint: true } }).decision, 'DENY'));
test('policy rejects traversal without roots', () => assert.ok(ps.evaluatePolicy({ kind: 'protocolsutra-policy', allowedTools: ['x'] }, { tool: 'x', arguments: { file: '../../secret' } }).reasons.some(r => r.startsWith('PATH_TRAVERSAL'))));
test('policy rejects windows-style traversal', () => assert.equal(ps.evaluatePolicy({ kind: 'protocolsutra-policy', allowedTools: ['x'] }, { tool: 'x', arguments: { path: '..\\..\\windows\\system32' } }).decision, 'DENY'));
test('policy rejects oversize arguments', () => assert.ok(ps.evaluatePolicy({ kind: 'protocolsutra-policy', allowedTools: ['x'], maxArgumentBytes: 10 }, { tool: 'x', arguments: { a: 'x'.repeat(50) } }).reasons.includes('ARGUMENTS_TOO_LARGE')));
test('policy rejects malformed input', () => { assert.throws(() => ps.evaluatePolicy({}, { tool: 'x' })); assert.throws(() => ps.evaluatePolicy({ kind: 'protocolsutra-policy' }, {})); });

// ---------- audit
test('audit flags poisoned fixture NO_GO with expected rules', async () => {
  const r = ps.auditSecurity(await fx('audit/poisoned.json'));
  assert.equal(r.gate, 'NO_GO');
  for (const x of ['TP_IGNORE_INSTRUCTIONS', 'TP_HIDDEN_DIRECTIVE', 'TP_EXFIL_DIRECTIVE', 'TP_SECRET_ACCESS', 'TP_CONCEAL', 'TP_HIDDEN_UNICODE', 'TOOL_HIGH_IMPACT_NAME', 'ANNOTATION_NAME_CONFLICT']) assert.ok(rules(r).includes(x), x);
});
test('audit passes clean fixture', async () => assert.equal(ps.auditSecurity(await fx('audit/clean.json')).gate, 'PASS'));
test('audit rejects unknown kind', () => assert.equal(ps.auditSecurity({ kind: 'x' }).gate, 'NO_GO'));
test('audit flags plaintext remote A2A', () => assert.ok(rules(ps.auditSecurity({ kind: 'a2a-agent-card', name: 'a', supportedInterfaces: [{ url: 'http://agent.example.invalid/', protocolBinding: 'JSONRPC' }] })).includes('A2A_PLAINTEXT_INTERFACE')));
test('audit flags secret in description', () => assert.ok(rules(ps.auditSecurity({ kind: 'mcp-snapshot', name: 'n', tools: [{ name: 't', description: 'use key ghp_abcdefghijklmnopqrstuvwx', inputSchema: { type: 'object' } }] })).includes('SECRET_IN_TEXT')));
test('audit never echoes secrets in report', () => assert.ok(!JSON.stringify(ps.auditSecurity({ kind: 'mcp-snapshot', name: 'n', tools: [{ name: 't', description: 'ghp_abcdefghijklmnopqrstuvwx', inputSchema: { type: 'object' } }] })).includes('ghp_abcdefghijklmnopqrstuvwx')));

// ---------- diff / regression
test('diff detects breaking changes', async () => {
  const r = ps.diffSnapshots(await fx('diff/v1.json'), await fx('diff/v2.json'));
  assert.equal(r.gate, 'NO_GO');
  for (const x of ['TOOL_REMOVED', 'TOOL_ADDED', 'CONTRACT_PROPERTY_TYPE_CHANGED', 'CONTRACT_REQUIRED_ADDED', 'DESCRIPTION_CHANGED']) assert.ok(rules(r).includes(x), x);
});
test('diff of identical snapshots passes', async () => { const a = await fx('diff/v1.json'); assert.equal(ps.diffSnapshots(a, a).gate, 'PASS'); });
test('diff rejects non-snapshots', () => assert.throws(() => ps.diffSnapshots({}, {}), /mcp-snapshot/));
test('regression reports only new non-info findings', () => {
  const prev = { findings: [{ rule: 'A', path: 'p', level: 'error', message: 'm' }] };
  const cur = { findings: [{ rule: 'A', path: 'p', level: 'error', message: 'm' }, { rule: 'B', path: 'q', level: 'error', message: 'n' }, { rule: 'C', path: 'r', level: 'info', message: 'i' }] };
  const r = ps.regression(prev, cur); assert.equal(r.findings.length, 1); assert.equal(r.gate, 'NO_GO');
});

// ---------- capsule
test('capsule round-trips and verifies', async () => { const c = ps.exportCapsule(ps.validateSnapshot(await fx('mcp/valid.json'))); assert.equal(ps.verifyCapsule(c).valid, true); });
test('capsule detects tampering', async () => { const c = ps.exportCapsule(ps.validateSnapshot(await fx('mcp/valid.json'))); c.evidence.gate = 'PASS-FORGED'; const v = ps.verifyCapsule(c); assert.equal(v.valid, false); assert.ok(v.problems.includes('DIGEST_MISMATCH')); });
test('capsule HMAC verifies with key and fails with wrong or missing key', () => {
  const key = 'a-sufficiently-long-test-key';
  const c = ps.exportCapsule({ gate: 'PASS' }, { key });
  assert.equal(ps.verifyCapsule(c, { key }).signature, 'verified');
  assert.equal(ps.verifyCapsule(c, { key: 'another-sufficiently-long-key' }).valid, false);
  assert.equal(ps.verifyCapsule(c).valid, false);
});
test('capsule redacts secrets at export', () => assert.ok(!JSON.stringify(ps.exportCapsule({ note: 'Bearer abcdefghijklmnopqrstu' })).includes('abcdefghijklmnopqrstu')));
test('capsule rejects short signing key', () => assert.throws(() => ps.exportCapsule({}, { key: 'short' }), /16/));
test('non-capsule is invalid', () => assert.equal(ps.verifyCapsule({ a: 1 }).valid, false));

// ---------- gate
test('gate: worst result wins', () => assert.equal(ps.releaseGate([{ name: 'a', report: { gate: 'PASS' } }, { name: 'b', report: { gate: 'NO_GO' } }]).decision, 'NO_GO'));
test('gate: all pass is GO', () => assert.equal(ps.releaseGate([{ name: 'a', report: { gate: 'PASS' } }]).decision, 'GO'));
test('gate: empty is INCONCLUSIVE not GO', () => assert.equal(ps.releaseGate([]).decision, 'INCONCLUSIVE'));
test('gate: report without gate is INCONCLUSIVE', () => assert.equal(ps.releaseGate([{ name: 'a', report: { rows: [] } }]).decision, 'INCONCLUSIVE'));
test('gate: REVIEW blocks unless allowed', () => { const e = [{ name: 'a', report: { gate: 'REVIEW' } }]; assert.equal(ps.releaseGate(e).decision, 'REVIEW'); assert.equal(ps.releaseGate(e, { allowReview: true }).decision, 'GO'); });

// ---------- fixtures
test('generated fixtures validate and replay cleanly', () => {
  assert.equal(ps.validateSnapshot(ps.createFixture('mcp')).gate, 'PASS');
  assert.equal(ps.validateSnapshot(ps.createFixture('a2a')).gate, 'PASS');
  assert.equal(ps.replaySuite(ps.createFixture('replay')).gate, 'PASS');
  assert.equal(ps.evaluatePolicy(ps.createFixture('policy'), { tool: 'echo' }).decision, 'ALLOW');
  assert.equal(ps.auditSecurity(ps.createFixture('mcp')).gate, 'PASS');
});
test('fixture name is sanitised', () => assert.ok(!ps.createFixture('mcp', '<script>x</script>').name.includes('<')));
test('unknown fixture kind rejected', () => assert.throws(() => ps.createFixture('nope')));

// ---------- reports
test('html report escapes every dynamic field, has no script and no external assets', () => {
  const html = ps.htmlReport({ evaluation: 'offline-structural-profile', gate: 'NO_GO', notice: '<img src=x onerror=1>', findings: [{ level: 'error', rule: '<b>R</b>', path: '"><script>', message: '<svg/onload=1>' }] });
  assert.ok(!/<script|<img|<svg|<b>/i.test(html.replace(/<style>[\s\S]*<\/style>/, '')));
  assert.match(html, /Content-Security-Policy/);
  assert.ok(!/(src|href)=["']https?:/.test(html));
});
test('markdown report has summary table and result line', () => { const md = ps.markdownReport(ps.auditSecurity({ kind: 'mcp-snapshot', name: 'n', tools: [] })); assert.match(md, /\*\*Result:\*\*/); assert.match(md, /\| Fact \| Value \|/); });
test('markdown cell escapes pipes', () => assert.ok(ps.markdownReport({ gate: 'REVIEW', findings: [{ level: 'warning', rule: 'R', path: 'p', message: 'a|b' }] }).includes('a\\|b')));

// ---------- CLI
test('CLI --version prints package version', async () => assert.equal(cli(['--version']).stdout.trim(), JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version));
test('CLI audit poisoned exits 2', () => assert.equal(cli(['audit', '--input', 'fixtures/audit/poisoned.json']).status, 2));
test('CLI policy deny exits 2, allow exits 0', () => {
  assert.equal(cli(['policy', '--policy', 'fixtures/policy/policy.json', '--call', 'fixtures/policy/call-ssrf.json']).status, 2);
  assert.equal(cli(['policy', '--policy', 'fixtures/policy/policy.json', '--call', 'fixtures/policy/call-allowed.json']).status, 0);
});
test('CLI diff breaking exits 2', () => assert.equal(cli(['diff', '--before', 'fixtures/diff/v1.json', '--after', 'fixtures/diff/v2.json']).status, 2));
test('CLI --strict turns REVIEW into exit 3', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ps-strict-')); const f = join(dir, 'm.json');
  await writeFile(f, JSON.stringify({ kind: 'mcp-snapshot', name: 'n', protocolVersion: '2099-01-01', capabilities: { tools: {} }, tools: [] }));
  assert.equal(cli(['validate', '--input', f]).status, 0);
  assert.equal(cli(['validate', '--input', f, '--strict']).status, 3);
});
test('CLI --format all writes json, md and html', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ps-all-')); const base = join(dir, 'audit');
  assert.equal(cli(['audit', '--input', 'fixtures/audit/poisoned.json', '--format', 'all', '--out', base]).status, 2);
  for (const e of ['json', 'md', 'html']) assert.ok((await readFile(`${base}.${e}`, 'utf8')).length > 200, e);
});
test('CLI --format all without --out errors', () => assert.equal(cli(['audit', '--input', 'fixtures/audit/clean.json', '--format', 'all']).status, 1));
test('CLI capsule export, verify, tamper detected', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ps-cap-')); const cap = join(dir, 'c.json');
  assert.equal(cli(['capsule', 'export', '--input', 'examples/reports/mcp-validation.json', '--out', cap]).status, 0);
  assert.equal(cli(['capsule', 'verify', '--input', cap]).status, 0);
  const o = JSON.parse(await readFile(cap, 'utf8')); o.evidence.gate = 'PASS'; await writeFile(cap, JSON.stringify(o));
  assert.equal(cli(['capsule', 'verify', '--input', cap]).status, 2);
});
test('CLI gate combines reports', () => {
  assert.equal(cli(['gate', '--report', 'examples/reports/mcp-validation.json', '--report', 'examples/reports/replay-passing.json']).status, 2);
  assert.equal(cli(['gate', '--report', 'examples/reports/replay-passing.json']).status, 0);
});
test('CLI fixture create writes a file that validates', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ps-fx-')); const out = join(dir, 'm.json');
  assert.equal(cli(['fixture', 'create', '--kind', 'mcp', '--out', out]).status, 0);
  assert.equal(cli(['validate', '--input', out]).status, 0);
});
test('CLI unknown command exits 1', () => assert.equal(cli(['bogus']).status, 1));
test('CLI missing option value exits 1', () => assert.equal(cli(['validate', '--input']).status, 1));
test('CLI malformed JSON exits 1', async () => { const dir = await mkdtemp(join(tmpdir(), 'ps-bad-')); const f = join(dir, 'x.json'); await writeFile(f, '{nope'); assert.equal(cli(['validate', '--input', f]).status, 1); });

// ---------- repository integrity
test('18 skills, agents and manifest entries agree', async () => {
  const manifest = JSON.parse(await readFile(join(root, 'agents/manifest.json'), 'utf8'));
  const skills = (await readdir(join(root, 'skills'), { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name).sort();
  assert.equal(skills.length, 18); assert.equal(manifest.agents.length, 18);
  assert.deepEqual(manifest.agents.map(a => a.id).sort(), skills);
  for (const s of skills) {
    const md = await readFile(join(root, 'skills', s, 'SKILL.md'), 'utf8');
    const fm = md.match(/^---\r?\nname: (.+)\r?\ndescription: (.+)\r?\n---/);
    assert.ok(fm, `${s} frontmatter`); assert.equal(fm[1].trim(), s); assert.ok(fm[2].length > 30);
    assert.ok((await readFile(join(root, 'agents', `${s}.md`), 'utf8')).length > 50, `${s} agent`);
  }
});
test('no secrets committed in repository text files', async () => {
  const re = /(ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{24,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
  const bad = [];
  async function walk(d) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (['node_modules', '.git'].includes(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (/\.(md|json|mjs|yml|html|txt|cff|sh|ps1|cmd)$/.test(e.name) && re.test(await readFile(p, 'utf8'))) bad.push(p);
    }
  }
  await walk(root);
  assert.deepEqual(bad.filter(p => !/tests[\\/]/.test(p) && !/fixtures[\\/]audit/.test(p)), []);
});
