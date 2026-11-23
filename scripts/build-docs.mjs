// Documentation site generator: Markdown -> themed static website (no dependencies, no inline scripts).
import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML as esc } from '../packages/core/safe-html.mjs';
import { auditSecurity } from '../packages/core/audit.mjs';
import { flow, checks, ladder, layers, bars, terminal, icon } from './site/diagrams.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'documents', 'protocolsutra');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const SITE = 'https://shahvatsalofficial.github.io/protocolsutra/';
const REPO = 'https://github.com/shahvatsalofficial/protocolsutra';
const NPM = 'https://www.npmjs.com/package/protocolsutra';
const ev = JSON.parse(await readFile(join(dir, 'evidence', 'evidence.json'), 'utf8'));
const corpus = JSON.parse(await readFile(join(root, 'fixtures/benchmark/audit-corpus.json'), 'utf8'));
const poisoned = JSON.parse(await readFile(join(root, 'fixtures/audit/poisoned.json'), 'utf8'));

// ---------- numbers shown in charts are recomputed here, never typed ----------
const flagged = c => auditSecurity({ kind: 'mcp-snapshot', name: 'b', tools: [{ name: 't', description: c.text, inputSchema: { type: 'object' } }] }).findings.some(f => f.level === 'error' && /^(TP_|SECRET_IN_TEXT)/.test(f.rule));
const plain = corpus.cases.filter(c => c.malicious && !c.evasion), evade = corpus.cases.filter(c => c.evasion), benign = corpus.cases.filter(c => !c.malicious);
const n = {
  plainHit: plain.filter(flagged).length, plain: plain.length, evHit: evade.filter(flagged).length, ev: evade.length,
  fp: benign.filter(flagged).length, benign: benign.length, tests: ev.tests.pass, testsTotal: ev.tests.total,
  denied: ev.boundary.blocked, attacks: ev.boundary.total, allowed: ev.boundary.legitimateAllowed, legit: ev.boundary.legitimateTotal
};

const DIAGRAMS = {
  'flow:pipeline': () => flow([{ t: 'Captured JSON', s: 'snapshot · card · trace', k: 'neutral' }, { t: 'Evaluator', s: 'pure and offline', k: 'brand' }, { t: 'Redact', s: 'secrets removed', k: 'brand' }, { t: 'Report', s: 'JSON · MD · HTML', k: 'ok' }, { t: 'Gate / CI', s: 'exit code 0 · 2 · 3', k: 'ok' }], 'From captured file to CI decision'),
  'flow:capsule': () => flow([{ t: 'Report', s: 'any command output', k: 'neutral' }, { t: 'Redact', s: 'secrets removed', k: 'brand' }, { t: 'Seal', s: 'SHA-256 (+ HMAC)', k: 'brand' }, { t: 'Share', s: 'capsule.json', k: 'ok' }, { t: 'Verify', s: 'digest recomputed', k: 'ok' }], 'Evidence capsule lifecycle'),
  'flow:trust': () => flow([{ t: 'Untrusted input', s: 'tool text · cards · traces', k: 'bad' }, { t: 'Parse and bound', s: 'depth · size · count', k: 'warn' }, { t: 'Pure evaluator', s: 'never executes input', k: 'brand' }, { t: 'Safe report', s: 'escaped · CSP · no JS', k: 'ok' }], 'Trust boundary: everything read from a file is data, never instructions'),
  'flow:ci': () => flow([{ t: 'Pull request', s: 'tool schema changes', k: 'neutral' }, { t: 'Capture', s: 'tools/list to JSON', k: 'neutral' }, { t: 'diff + audit', s: 'protocolsutra', k: 'brand' }, { t: 'gate --strict', s: 'worst result wins', k: 'brand' }, { t: 'Merge or block', s: 'exit 0 or 2', k: 'ok' }], 'Pull-request gate'),
  'checks:policy': () => checks([{ q: 'Tool on the allowlist?', s: 'deny list always wins', deny: 'TOOL_NOT_ALLOWED' }, { q: 'Arguments small enough?', s: 'default cap 64 KB', deny: 'TOO_LARGE' }, { q: 'Paths inside the roots?', s: 'no .. or absolute escapes', deny: 'PATH_*' }, { q: 'URLs safe and listed?', s: 'https · public · allow-listed', deny: 'URL_*' }], 'ALLOW', 'How `policy` decides one tool call', 'Policy decision flow'),
  ladder: () => ladder('Gate results, from best to worst'),
  layers: () => layers('Module layers'),
  'chart:benchmark': () => bars([
    { label: 'Plain attacks caught', value: n.plainHit, total: n.plain, k: 'ok' },
    { label: 'Evasions caught', value: n.evHit, total: n.ev, k: 'bad' },
    { label: 'Benign passed clean', value: n.benign - n.fp, total: n.benign, k: 'ok' },
    { label: 'Benign wrongly flagged', value: n.fp, total: n.benign, k: 'warn' }], `Poisoning heuristic on ${corpus.cases.length} labelled descriptions (regenerated on every docs build)`),
  'chart:assurance': () => bars([
    { label: 'Automated tests passing', value: n.tests, total: n.testsTotal, k: 'ok' },
    { label: 'Attack calls denied', value: n.denied, total: n.attacks, k: 'ok' },
    { label: 'Legitimate calls allowed', value: n.allowed, total: n.legit, k: 'ok' }], 'Measured by `npm run evidence` on the maintainer machine')
};

// ---------- markdown ----------
const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
function inline(t) {
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  t = esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
      const h = href.replace(/&amp;/g, '&');
      if (/^https?:/.test(h)) return `<a href="${esc(h)}" rel="noopener noreferrer">${text}</a>`;
      if (/^[\w./-]+\.md(#[\w-]+)?$/.test(h)) return `<a href="${esc(h.replace(/\.md/, '.html'))}">${text}</a>`;
      return `<a href="${esc(h)}">${text}</a>`;
    });
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}
function render(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n'), out = [], toc = [];
  let i = 0, title = '';
  while (i < lines.length) {
    const l = lines[i];
    const d = l.match(/^\{\{([\w:]+)\}\}\s*$/);
    if (d) { out.push(DIAGRAMS[d[1]] ? DIAGRAMS[d[1]]() : `<p><em>Missing diagram ${esc(d[1])}</em></p>`); i++; continue; }
    if (/^```/.test(l)) {
      const lang = l.slice(3).trim(), buf = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) buf.push(lines[i]);
      i++;
      if (lang === 'terminal') { out.push(terminal(buf)); continue; }
      out.push(`<div class="codewrap"${lang ? ` data-lang="${esc(lang)}"` : ''}><pre tabindex="0"><code>${esc(buf.join('\n'))}</code></pre></div>`);
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lv = h[1].length, id = slug(h[2]);
      if (lv === 1) title = h[2].replace(/`/g, '');
      if (lv === 2) toc.push([id, h[2].replace(/`/g, '')]);
      out.push(`<h${lv} id="${id}">${inline(h[2])}${lv >= 2 && lv <= 3 ? `<a class="anc" href="#${id}" aria-label="Link to this section">#</a>` : ''}</h${lv}>`);
      i++; continue;
    }
    if (/^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const row = r => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
      const head = row(l); i += 2; const body = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) body.push(row(lines[i++]));
      out.push(`<div class="tw" role="region" tabindex="0" aria-label="Table"><table><thead><tr>${head.map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^>\s?/.test(l)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`); continue; }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l), items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')); i++; }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${tag}>`);
      continue;
    }
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\||\{\{|\s*([-*]|\d+\.)\s|---+\s*$)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc, title };
}

// ---------- structure ----------
const GROUPS = [
  ['Start', [['00-start-here', 'Overview'], ['03-user-guide', 'User guide'], ['12-real-world-scenarios', 'Real-world scenarios']]],
  ['Understand', [['01-executive-summary', 'Executive summary'], ['02-functional-guide', 'Functional guide'], ['04-architecture', 'Architecture']]],
  ['Reference', [['05-technical-reference', 'Technical reference'], ['06-security-and-threat-model', 'Security and threat model'], ['07-evidence-and-methodology', 'Evidence and method'], ['evidence/evidence', 'Evidence (generated)'], ['09-agents-and-skills', 'Agents and skills']]],
  ['Project', [['08-legal-and-compliance', 'Legal and compliance'], ['10-faq-and-limitations', 'FAQ and limitations'], ['11-roadmap-and-releases', 'Roadmap and releases']]]
];
const FLAT = GROUPS.flatMap(([, items]) => items.map(([f, t]) => ({ f, t })));
const logo = `<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a5cf0"/><stop offset="1" stop-color="#0fb3c2"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lg)"/><path d="M8.500 16.500l5 5 10-11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#3949d6"/><path d="M8.500 16.500l5 5 10-11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`;

function sidebar(base, current) {
  const top = `<div class="side-top"><a href="${base}index.html">Home</a><a href="${base}examples/security-audit-poisoned.html">Sample report</a><a href="${REPO}" rel="noopener noreferrer">GitHub</a><a href="${NPM}" rel="noopener noreferrer">npm</a></div>`;
  return `<aside class="side" id="drawer" aria-label="Documentation">${top}${GROUPS.map(([g, items]) => `<h4>${g}</h4>${items.map(([f, t]) => `<a href="${base}${f}.html"${f === current ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('')}`).join('')}</aside>`;
}
function header(base, active) {
  const l = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header class="nav"><div class="nav-in"><button id="menu-btn" class="icon-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><span class="i-menu">${icon('menu', 20)}</span><span class="i-close">${icon('close', 20)}</span></button><a class="brand" href="${base}index.html">${logo}<span>ProtocolSutra</span><small>v${esc(pkg.version)}</small></a><nav class="nav-links" aria-label="Primary">${l(base + '00-start-here.html', 'Docs', 'docs')}${l(base + '12-real-world-scenarios.html', 'Scenarios', 'scn')}${l(base + 'evidence/evidence.html', 'Evidence', 'ev')}${l(base + 'examples/security-audit-poisoned.html', 'Sample report', 'rep')}</nav><span class="sp"></span><a class="icon-btn" href="${REPO}" rel="noopener noreferrer" aria-label="ProtocolSutra on GitHub" title="GitHub">${icon('github', 20)}</a><button id="theme-btn" class="icon-btn" type="button" aria-label="Switch to dark theme" aria-pressed="false" title="Toggle theme"><span class="i-moon">${icon('moon', 20)}</span><span class="i-sun">${icon('sun', 20)}</span></button></div></header><div class="scrim"></div>`;
}
function shell({ title, desc, base, body, path, ld, cls = '' }) {
  const url = SITE + path;
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="color-scheme" content="light dark"><link rel="canonical" href="${esc(url)}"><link rel="icon" href="${favicon}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary"><meta name="author" content="Vatsal Shah"><script src="${base}assets/theme.js"></script><link rel="stylesheet" href="${base}assets/site.css">${ld ? `<script type="application/ld+json">${ld}</script>` : ''}</head><body class="${cls}"><a class="skip" href="#main">Skip to content</a>${body}<script src="${base}assets/site.js" defer></script></body></html>`;
}

// ---------- doc pages ----------
function docPage(f, md) {
  const nested = f.includes('/'), base = nested ? '../' : '';
  const { html, toc, title } = render(md);
  const idx = FLAT.findIndex(x => x.f === f), prev = FLAT[idx - 1], next = FLAT[idx + 1];
  const group = GROUPS.find(([, items]) => items.some(([k]) => k === f))?.[0] ?? 'Docs';
  const pager = `<nav class="pager" aria-label="Pagination">${prev ? `<a href="${base}${prev.f}.html"><small>Previous</small>${esc(prev.t)}</a>` : '<span></span>'}${next ? `<a class="nx" href="${base}${next.f}.html"><small>Next</small>${esc(next.t)}</a>` : '<span></span>'}</nav>`;
  const src = nested ? 'documents/protocolsutra/evidence/evidence.md' : `documents/protocolsutra/${f}.md`;
  const tocHtml = toc.length > 2 ? `<nav class="toc-r" aria-label="On this page"><strong>On this page</strong>${toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>` : '<div></div>';
  const body = `${header(base, f === 'evidence/evidence' || f === '07-evidence-and-methodology' ? 'ev' : f === '12-real-world-scenarios' ? 'scn' : 'docs')}<div class="doc">${sidebar(base, f)}<main id="main" class="prose"><div class="crumbs"><a href="${base}index.html">Home</a> / ${esc(group)} / ${esc(title)}</div>${html}<div class="edit"><a href="${REPO}/blob/main/${src}" rel="noopener noreferrer">View source on GitHub</a><a href="${REPO}/issues/new" rel="noopener noreferrer">Report a docs problem</a></div>${pager}</main>${tocHtml}</div><div class="page-foot">ProtocolSutra AI ${esc(pkg.version)} · Created by Vatsal Shah · Apache-2.0 · An offline evaluation tool, not an official MCP or A2A conformance suite.</div>`;
  const first = (md.match(/^[A-Za-z*`][^\n#|>-].{40,}/m) || [title])[0].replace(/[*`]/g, '').slice(0, 155);
  return shell({ title: `${title} · ProtocolSutra AI`, desc: first, base, body, path: `${f}.html` });
}

// ---------- landing page ----------
function landing() {
  const base = '';
  const term = auditSecurity(poisoned);
  const errs = term.findings.filter(f => f.level === 'error');
  const lines = ['$ npx protocolsutra audit --input poisoned.json --format all --out report', `NO_GO  security audit · ${term.findings.length} findings (${errs.length} errors)`, '',
    ...errs.slice(0, 4).map(f => `ERROR    ${f.rule.padEnd(24)} ${f.path}`), ...term.findings.filter(f => f.level === 'warning').slice(0, 1).map(f => `WARNING  ${f.rule.padEnd(24)} ${f.path}`), '', 'Reports: report.json  report.md  report.html', '$ echo $?', '2'];
  const feat = [
    ['search', 'audit', 'Tool-poisoning, hidden Unicode, leaked secrets, unsafe schemas.', 'Heuristic', 'h', 'functional'],
    ['diff', 'diff', 'Breaking changes between two tool snapshots, before they ship.', 'Structural', 's', 'functional'],
    ['check', 'validate', 'Structural profile for MCP snapshots and A2A Agent Cards.', 'Structural', 's', 'functional'],
    ['replay', 'replay', 'Recorded JSON-RPC traces. A missing response is never a pass.', 'Imported', 'i', 'functional'],
    ['lock', 'policy', 'Allow or deny a tool call: path traversal, SSRF, allowlists.', 'Local policy', 'l', 'functional'],
    ['gate', 'gate', 'Worst result wins. One blocking failure cannot be averaged away.', 'Aggregation', 'i', 'functional'],
    ['trend', 'regression', 'Which findings are new since the last saved report.', 'Structural', 's', 'functional'],
    ['file', 'capsule', 'Redacted, SHA-256 sealed evidence package you can verify.', 'Integrity', 'l', 'functional'],
    ['grid', 'matrix', 'Host, protocol and version summary. Reported, never verified.', 'Reported', 'i', 'functional'],
    ['package', 'fixture create', 'Synthetic, credential-free fixtures to start from.', 'Utility', 'i', 'user-guide'],
    ['download', 'install-skills', '18 agent skills into Claude, Cursor, Codex, Gemini or Copilot dirs.', 'Utility', 'i', 'agents-and-skills'],
    ['server', 'serve', 'Localhost, token-protected, read-only report server.', 'Utility', 'i', 'technical-reference']
  ];
  const map = { functional: '02-functional-guide', 'user-guide': '03-user-guide', 'agents-and-skills': '09-agents-and-skills', 'technical-reference': '05-technical-reference' };
  const scn = [
    ['1', 'diff', 'A pull request silently breaks a tool', 'A renamed parameter would break every agent calling it. Catch it in CI, with the exact path.', 'a-pull-request-breaks-a-tool'],
    ['2', 'search', 'Vetting a third-party MCP server', 'Its tool description tells the model to read your SSH key. See it flagged before you connect.', 'vetting-a-third-party-mcp-server'],
    ['3', 'lock', 'An agent tries to escape its sandbox', 'Path traversal and a cloud-metadata URL, denied by a deterministic policy, with reason codes.', 'an-agent-tries-to-escape-its-workspace'],
    ['4', 'gate', 'A release gate nobody can game', 'A passing replay next to a failing validation: the gate still says NO_GO. Missing evidence is not a pass.', 'a-release-gate-that-cannot-be-averaged-away'],
    ['5', 'file', 'Handing proof to a security reviewer', 'Seal a report, send it, and let the reviewer detect any edit with one command.', 'handing-proof-to-a-security-reviewer'],
    ['6', 'shield', 'Reviewing a partner’s A2A Agent Card', 'Missing binding, duplicate skills, plaintext URL. A clear list instead of a vague feeling.', 'reviewing-a-partners-a2a-agent-card']
  ];
  const body = `${header(base, '')}${sidebar(base, '')}
<main id="main">
<section class="hero"><div class="container hero-in"><div>
<span class="badge"><b>●</b> v${esc(pkg.version)} · Apache-2.0 · zero dependencies</span>
<h1>Prove your <span class="grad">MCP and A2A</span> integrations, offline.</h1>
<p class="lead">ProtocolSutra turns “I think it works” into a repeatable report. Catch breaking tool changes and poisoned tool descriptions in CI, and hand reviewers evidence they can verify.</p>
<div class="cta"><a class="btn primary" href="00-start-here.html">Get started ${icon('arrow', 18)}</a><a class="btn" href="${REPO}" rel="noopener noreferrer">${icon('github', 18)} GitHub</a></div>
<div class="install"><code>npx protocolsutra audit --input snapshot.json</code><button class="copy" type="button" data-copy="npx protocolsutra audit --input snapshot.json" aria-label="Copy command"><span class="lbl">Copy</span></button></div>
</div><div>${terminal(lines)}</div></div></section>
<section class="container"><div class="stats">
<div class="stat"><b>${n.tests}/${n.testsTotal}</b><span>automated tests passing</span></div>
<div class="stat"><b>${n.denied}/${n.attacks}</b><span>adversarial calls denied</span></div>
<div class="stat"><b>0</b><span>runtime dependencies</span></div>
<div class="stat"><b>3 × 3</b><span>OS × Node versions in CI</span></div></div></section>
<section class="section"><div class="container"><span class="eyebrow">Why it exists</span><h2>Three risks that hide until production</h2><p class="sub">Agents trust the tools they are given. Nobody checks the tools.</p>
<div class="grid g3">
<div class="card"><div class="ico bad">${icon('diff', 24)}</div><h3>Silent breakage</h3><p>A tool’s input schema changes. Agents that call it start failing, and nothing warns you until users complain.</p></div>
<div class="card"><div class="ico warn">${icon('alert', 24)}</div><h3>Poisoned tool metadata</h3><p>Tool descriptions are read by language models. A hostile server can hide instructions in them, or swap them after you approved.</p></div>
<div class="card"><div class="ico">${icon('scale', 24)}</div><h3>Unprovable claims</h3><p>“Works with Cursor”, “secure by design”. Claims are cheap. A reviewer needs something they can re-run.</p></div></div></div></section>
<section class="section alt"><div class="container"><span class="eyebrow">How it works</span><h2>Files in, evidence out</h2><p class="sub">Every command reads a captured JSON file, evaluates it with pure functions, redacts secrets and writes JSON, Markdown and HTML.</p>${DIAGRAMS['flow:pipeline']()}
<div class="grid g3" style="margin-top:8px"><div class="card"><h3>Offline by default</h3><p>No network, no subprocess, no tool execution, no API key, no telemetry.</p></div><div class="card"><h3>Honest verdicts</h3><p>Four non-pass states. A missing observation is INCONCLUSIVE, never PASS.</p></div><div class="card"><h3>Reproducible</h3><p>Canonical SHA-256 digests. Re-run on the same input and the digest must match.</p></div></div></div></section>
<section class="section"><div class="container"><span class="eyebrow">Commands</span><h2>One CLI, twelve jobs</h2><p class="sub">Each card shows the evidence class, so you always know what a result can and cannot prove.</p>
<div class="grid g4">${feat.map(([ic, name, d, chip, cls, doc]) => `<a class="card" href="${map[doc]}.html"><div class="ico">${icon(ic, 22)}</div><h3><code>${esc(name)}</code></h3><p>${esc(d)}</p><span class="chip ${cls}">${esc(chip)}</span></a>`).join('')}</div></div></section>
<section class="section alt"><div class="container"><span class="eyebrow">Real-world scenarios</span><h2>Built for the bad days</h2><p class="sub">Six situations, each with the real command and the real output.</p>
<div class="grid g3">${scn.map(([k, ic, t, d, a]) => `<a class="card scn" href="12-real-world-scenarios.html#${a}"><span class="n">SCENARIO ${k}</span><div class="ico">${icon(ic, 22)}</div><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="more">Read scenario ${icon('arrow', 16)}</span></a>`).join('')}</div></div></section>
<section class="section"><div class="container"><span class="eyebrow">Proof</span><h2>Numbers you can reproduce</h2><p class="sub">Every figure is regenerated by <code>npm run evidence</code>. The benchmark publishes the cases it fails.</p>
<div class="split"><div>${DIAGRAMS['chart:assurance']()}${DIAGRAMS['chart:benchmark']()}</div>
<div class="honest"><h3>${icon('alert', 22)} What this does not prove</h3><ul><li>The poisoning detector is regex-based. Paraphrase, other languages and encodings evade it. We publish those misses on purpose.</li><li>The benchmark is small (${corpus.cases.length} cases) and partly written by the rule author. Treat it as optimistic.</li><li>No live MCP or A2A server is contacted. This is not an official conformance suite and holds no certification.</li><li><b>PASS</b> means “nothing blocking found by these checks”, never “secure”.</li></ul><p style="margin:14px 0 0"><a href="07-evidence-and-methodology.html">How the numbers are produced</a> · <a href="10-faq-and-limitations.html">Full limitations</a></p></div></div></div></section>
<section class="section alt"><div class="container"><span class="eyebrow">Quick start</span><h2>From zero to a report in 60 seconds</h2><p class="sub">Node.js 20 or newer. Nothing else to install.</p>
<div class="steps"><div class="step"><h3>Create a snapshot</h3><p>Start from a synthetic fixture, or save your server’s <code>tools/list</code> output.</p><div class="codewrap"><pre><code>npx protocolsutra fixture create \\
  --kind mcp --out snapshot.json</code></pre></div></div>
<div class="step"><h3>Run the checks</h3><p>Structure first, then the security audit.</p><div class="codewrap"><pre><code>npx protocolsutra validate --input snapshot.json
npx protocolsutra audit --input snapshot.json</code></pre></div></div>
<div class="step"><h3>Open the report</h3><p>JSON for machines, Markdown for PRs, HTML for people.</p><div class="codewrap"><pre><code>npx protocolsutra audit --input snapshot.json \\
  --format all --out report</code></pre></div></div></div></div></section>
<section class="section"><div class="container"><div class="band"><h2>Evidence beats opinion.</h2><p>Open source, Apache-2.0, zero dependencies. Add it to your CI today.</p><a class="btn" href="03-user-guide.html">Read the user guide ${icon('arrow', 18)}</a></div></div></section>
</main>
<footer class="site"><div class="container"><div class="foot"><div><a class="brand" href="index.html">${logo}<span>ProtocolSutra</span></a><p>Offline MCP and A2A interoperability lab. Connect. Validate. Prove.</p></div>
<div><h5>Docs</h5><a href="00-start-here.html">Overview</a><a href="03-user-guide.html">User guide</a><a href="12-real-world-scenarios.html">Scenarios</a><a href="05-technical-reference.html">Reference</a></div>
<div><h5>Trust</h5><a href="07-evidence-and-methodology.html">Evidence</a><a href="06-security-and-threat-model.html">Security</a><a href="08-legal-and-compliance.html">Legal</a><a href="10-faq-and-limitations.html">Limitations</a></div>
<div><h5>Project</h5><a href="${REPO}" rel="noopener noreferrer">GitHub</a><a href="${NPM}" rel="noopener noreferrer">npm</a><a href="11-roadmap-and-releases.html">Roadmap</a><a href="${REPO}/blob/main/CHANGELOG.md" rel="noopener noreferrer">Changelog</a></div></div>
<div class="legal">© 2026 Vatsal Shah · Apache-2.0. Independent project: not affiliated with, endorsed by or certified by the MCP or A2A projects or any IDE vendor. PASS is not a security or conformance certification.</div></div></footer>`;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'ProtocolSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux', softwareVersion: pkg.version, license: 'https://www.apache.org/licenses/LICENSE-2.0', author: { '@type': 'Person', name: 'Vatsal Shah' }, url: SITE, codeRepository: REPO, description: 'Offline-first MCP and A2A interoperability lab: validate snapshots, audit tool poisoning, diff contracts, replay traces and gate releases.', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } });
  return shell({ title: 'ProtocolSutra AI — Prove your MCP and A2A integrations, offline', desc: 'Offline-first CLI that validates MCP and A2A snapshots, audits tool poisoning, diffs contracts, replays traces and gates releases. Zero dependencies, Apache-2.0.', base, body, path: '', ld, cls: 'landing' });
}

// ---------- write site ----------
await mkdir(join(dir, 'assets'), { recursive: true });
for (const f of ['site.css', 'site.js', 'theme.js']) await copyFile(join(root, 'scripts/site', f), join(dir, 'assets', f));
const mdFiles = (await readdir(dir)).filter(f => /^\d\d-.*\.md$/.test(f)).map(f => f.replace(/\.md$/, ''));
const pages = [...mdFiles, 'evidence/evidence'];
for (const f of pages) {
  if (!FLAT.some(x => x.f === f)) throw new Error(`Doc ${f} missing from navigation groups`);
  await writeFile(join(dir, `${f}.html`), docPage(f, await readFile(join(dir, `${f}.md`), 'utf8')));
  console.log('built', `${f}.html`);
}
await writeFile(join(dir, 'index.html'), landing());
await writeFile(join(dir, '404.html'), shell({ title: 'Page not found · ProtocolSutra AI', desc: 'Page not found', base: '', path: '404.html', cls: 'landing', body: `${header('', '')}${sidebar('', '')}<main id="main" class="container" style="padding:80px 20px;text-align:center"><h1>Page not found</h1><p>That page does not exist. <a href="index.html">Go home</a> or <a href="00-start-here.html">read the docs</a>.</p></main>` }));
const urls = ['', ...pages.map(f => `${f}.html`)];
await writeFile(join(dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(join(dir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
console.log('built index.html, 404.html, sitemap.xml, robots.txt');
