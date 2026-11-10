#!/usr/bin/env node
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { readJSON, sanitize } from '../core/utils.mjs';
import { validateSnapshot } from '../core/validate.mjs';
import { replaySuite } from '../core/replay.mjs';
import { compatibilityMatrix } from '../core/matrix.mjs';
import { htmlReport, markdownReport } from '../core/report.mjs';
import { installSkills, hostPaths } from '../core/installer.mjs';
import { auditSecurity } from '../core/audit.mjs';
import { diffSnapshots, regression } from '../core/diff.mjs';
import { evaluatePolicy } from '../core/policy.mjs';
import { exportCapsule, verifyCapsule } from '../core/capsule.mjs';
import { releaseGate } from '../core/gate.mjs';
import { createFixture } from '../core/fixture.mjs';
import { createReportServer } from '../server/index.mjs';

const pkg = JSON.parse(await readFile(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'));
const NAME = 'protocolsutra';
const help = `ProtocolSutra AI ${pkg.version} — offline-first MCP and A2A interoperability lab
Created by Vatsal Shah · Connect. Validate. Prove.

Usage: ${NAME} <command> [options]

Evaluate (offline, deterministic, no network, no tool execution)
  validate --input <snapshot.json>             structural profile check (MCP snapshot / A2A card)
  audit    --input <snapshot.json>             heuristic security audit (tool poisoning, secrets, unsafe schemas)
  diff     --before <old.json> --after <new.json>   breaking-change contract diff of two MCP snapshots
  replay   --input <suite.json>                recorded JSON-RPC replay with permission checks
  matrix   --input <evidence.json>             reported-evidence compatibility matrix
  policy   --policy <policy.json> --call <call.json>   allow/deny decision for one tool call
  regression --before <report.json> --after <report.json>   new findings between two reports
  gate     --report <a.json> [--report <b.json> ...] [--allow-review]   worst-result-wins release gate

Evidence
  capsule export --input <report.json> [--source <label>] [--out <file>]   redacted + sha256 (+HMAC if PROTOCOLSUTRA_SIGNING_KEY)
  capsule verify --input <capsule.json>        integrity check

Project
  fixture create --kind mcp|a2a|replay|policy|matrix [--name <n>] [--out <file>]
  install-skills --host ${Object.keys(hostPaths).join('|')} --target <dir> [--force]
  serve --report <report.json> [--port 8765]   localhost read-only report server (PROTOCOLSUTRA_TOKEN, >=16 chars)
  doctor | --version | --help

Common options
  --format json|md|html|all   (default json)   --out <path>   (with "all": writes <path>.json/.md/.html)
  --strict                    exit 3 on REVIEW/INCONCLUSIVE (CI); default exits 0 for those

Exit codes: 0 ok · 1 usage/runtime error · 2 NO_GO/DENY · 3 REVIEW/INCONCLUSIVE with --strict
Boundaries: offline structural profiles and imported-recording replay. Not MCP/A2A conformance certification.
`;
const BOOL = new Set(['force', 'strict', 'allow-review', 'help', 'version']);
const MULTI = new Set(['report']);
function argsOf(a) {
  const out = { _: [] };
  for (let i = 0; i < a.length; i++) {
    const arg = a[i];
    if (!arg.startsWith('--')) { out._.push(arg); continue; }
    const key = arg.slice(2);
    if (BOOL.has(key)) { out[key] = true; continue; }
    if (i + 1 >= a.length || a[i + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
    const v = a[++i];
    if (MULTI.has(key)) (out[key] ||= []).push(v); else out[key] = v;
  }
  return out;
}
const render = (result, fmt) => (fmt === 'json' ? JSON.stringify(result, null, 2) + '\n' : fmt === 'md' ? markdownReport(result) : htmlReport(result));
async function emit(file, text) { await mkdir(dirname(file), { recursive: true }); await writeFile(file, text, 'utf8'); }
async function saveResult(result, args) {
  result = sanitize(result);
  const fmt = args.format || 'json';
  if (!['json', 'md', 'html', 'all'].includes(fmt)) throw new Error('format must be json|md|html|all');
  if (fmt === 'all') {
    if (!args.out) throw new Error('--format all requires --out <basename>');
    const base = resolve(args.out).replace(/\.(json|md|html)$/i, '');
    for (const f of ['json', 'md', 'html']) await emit(`${base}.${f}`, render(result, f));
    console.log(`Reports: ${base}.json ${base}.md ${base}.html`);
  } else if (args.out) { const file = resolve(args.out); await emit(file, render(result, fmt)); console.log(`Report: ${file}`); }
  else console.log(render(result, fmt));
  const g = result.gate;
  if (g === 'NO_GO' || g === 'DENY') process.exitCode = 2;
  else if (args.strict && (g === 'REVIEW' || g === 'INCONCLUSIVE')) process.exitCode = 3;
}
const need = (args, k) => { if (!args[k]) throw new Error(`--${k} required`); return args[k]; };

async function main() {
  const { _: pos, ...args } = argsOf(process.argv.slice(2));
  const command = pos[0];
  if (args.version) { console.log(pkg.version); return; }
  if (!command || command === 'help' || args.help) { console.log(help); return; }
  switch (command) {
    case 'validate': return saveResult(validateSnapshot(await readJSON(need(args, 'input'))), args);
    case 'audit': return saveResult(auditSecurity(await readJSON(need(args, 'input'))), args);
    case 'replay': return saveResult(replaySuite(await readJSON(need(args, 'input'))), args);
    case 'matrix': return saveResult(compatibilityMatrix(await readJSON(need(args, 'input'))), args);
    case 'diff': return saveResult(diffSnapshots(await readJSON(need(args, 'before')), await readJSON(need(args, 'after'))), args);
    case 'regression': return saveResult(regression(await readJSON(need(args, 'before')), await readJSON(need(args, 'after'))), args);
    case 'policy': return saveResult(evaluatePolicy(await readJSON(need(args, 'policy')), await readJSON(need(args, 'call'))), args);
    case 'gate': {
      const files = args.report || [];
      const entries = [];
      for (const f of files) entries.push({ name: f, report: await readJSON(f) });
      return saveResult(releaseGate(entries, { allowReview: args['allow-review'] === true }), args);
    }
    case 'capsule': {
      const sub = pos[1];
      if (sub === 'export') {
        const cap = exportCapsule(await readJSON(need(args, 'input')), { source: args.source || args.input, key: process.env.PROTOCOLSUTRA_SIGNING_KEY });
        const text = JSON.stringify(cap, null, 2) + '\n';
        if (args.out) { await emit(resolve(args.out), text); console.log(`Capsule: ${resolve(args.out)}`); } else console.log(text);
        return;
      }
      if (sub === 'verify') {
        const r = verifyCapsule(await readJSON(need(args, 'input')), { key: process.env.PROTOCOLSUTRA_SIGNING_KEY });
        console.log(JSON.stringify(r, null, 2));
        if (!r.valid) process.exitCode = 2;
        return;
      }
      throw new Error('capsule needs export|verify');
    }
    case 'fixture': {
      if (pos[1] !== 'create') throw new Error('fixture needs "create"');
      const text = JSON.stringify(createFixture(need(args, 'kind'), args.name), null, 2) + '\n';
      if (args.out) { await emit(resolve(args.out), text); console.log(`Fixture: ${resolve(args.out)}`); } else console.log(text);
      return;
    }
    case 'install-skills':
      console.log(JSON.stringify(await installSkills({ host: args.host || 'generic', target: args.target || '.', force: args.force === true }), null, 2));
      return;
    case 'serve': {
      const port = args.port === undefined ? 8765 : Number(args.port);
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('--port must be 0..65535');
      const server = createReportServer({ reportPath: need(args, 'report'), token: process.env.PROTOCOLSUTRA_TOKEN });
      server.listen(port, '127.0.0.1', () => console.log(`ProtocolSutra read-only report server on http://127.0.0.1:${server.address().port} (requires bearer token)`));
      return;
    }
    case 'doctor':
      console.log(JSON.stringify({ product: 'ProtocolSutra AI', version: pkg.version, node: process.version, platform: process.platform, arch: process.arch, offlineCore: true, liveMcpRunner: false, liveA2aRunner: false, hostCompatibility: 'not-tested', protocolProfiles: { mcp: '2026-07-28 structural subset', a2a: '1.0 structural subset' }, commands: ['validate', 'audit', 'diff', 'replay', 'matrix', 'policy', 'regression', 'gate', 'capsule', 'fixture', 'install-skills', 'serve', 'doctor'], modelApiKeyRequired: false, networkRequired: false }, null, 2));
      return;
    default: throw new Error(`Unknown command ${command}\n${help}`);
  }
}
main().catch(err => { console.error(`ProtocolSutra error: ${err.message}`); process.exitCode = 1; });
