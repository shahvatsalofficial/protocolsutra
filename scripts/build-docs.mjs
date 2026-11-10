// Markdown -> self-contained HTML (no dependencies, no scripts, no external assets).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML as esc } from '../packages/core/safe-html.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'documents', 'protocolsutra');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
function inline(t) {
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  t = esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
      const h = href.replace(/&amp;/g, '&');
      if (/^(https?:|mailto:|#)/.test(h)) return `<a href="${esc(h)}" rel="noopener noreferrer">${text}</a>`;
      if (/^[\w./-]+\.md(#[\w-]+)?$/.test(h)) return `<a href="${esc(h.replace(/\.md/, '.html'))}">${text}</a>`;
      return `<a href="${esc(h)}">${text}</a>`;
    });
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}
function render(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [], toc = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const lang = l.slice(3).trim(); const buf = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) buf.push(lines[i]);
      i++;
      out.push(`<pre${lang ? ` data-lang="${esc(lang)}"` : ''} tabindex="0"><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { const n = h[1].length, id = slug(h[2]); if (n === 2) toc.push([id, h[2].replace(/`/g, '')]); out.push(`<h${n} id="${id}">${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const row = r => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
      const head = row(l); i += 2; const body = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) body.push(row(lines[i++]));
      out.push(`<div class="tw" role="region" tabindex="0"><table><thead><tr>${head.map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^>\s?/.test(l)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue; }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')); i++; }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\||\s*([-*]|\d+\.)\s|---+\s*$)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}
const CSS = `:root{color-scheme:light dark;--bg:#f6f8fb;--card:#fff;--fg:#17202e;--mut:#556178;--bd:#d9e1ec;--acc:#2447c9;--accb:#e8edff;--code:#eef2f8}
@media (prefers-color-scheme:dark){:root{--bg:#0e131c;--card:#161d2a;--fg:#e8edf6;--mut:#9aa7bd;--bd:#2a3547;--acc:#8aa4ff;--accb:#1b2745;--code:#1d2638}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:var(--acc)}.skip{position:absolute;left:-999px}.skip:focus{left:8px;top:8px;background:var(--card);padding:8px 12px;z-index:9}
.layout{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:100vh}
nav.side{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:24px 18px;border-right:1px solid var(--bd);background:var(--card)}
nav.side .brand{font-weight:800;font-size:1.05rem;margin-bottom:2px}nav.side .tag{color:var(--mut);font-size:.85rem;margin-bottom:18px}
nav.side a{display:block;padding:6px 10px;border-radius:8px;text-decoration:none;color:var(--fg);font-size:.93rem}
nav.side a:hover{background:var(--accb)}nav.side a[aria-current=page]{background:var(--accb);color:var(--acc);font-weight:700}
main{padding:40px clamp(18px,5vw,64px) 80px;max-width:980px}
h1{font-size:2rem;line-height:1.2;margin:0 0 8px}h2{font-size:1.4rem;margin:44px 0 12px;padding-top:12px;border-top:1px solid var(--bd)}h3{font-size:1.1rem;margin:28px 0 8px}h4{margin:20px 0 6px}
.toc{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:14px 20px;margin:18px 0 8px}.toc strong{display:block;margin-bottom:6px;color:var(--mut);font-size:.8rem;letter-spacing:.06em;text-transform:uppercase}.toc ol{margin:0;padding-left:20px;columns:2}
code{font:.88em ui-monospace,Menlo,Consolas,monospace;background:var(--code);padding:1px 6px;border-radius:5px}pre{background:var(--code);border:1px solid var(--bd);border-radius:12px;padding:16px 18px;overflow:auto}pre code{background:none;padding:0}
blockquote{margin:16px 0;padding:10px 18px;border-left:4px solid var(--acc);background:var(--card);border-radius:0 10px 10px 0}
.tw{overflow-x:auto;border:1px solid var(--bd);border-radius:12px;background:var(--card);margin:14px 0}table{border-collapse:collapse;width:100%;font-size:.93rem}th,td{padding:9px 14px;text-align:left;border-bottom:1px solid var(--bd);vertical-align:top}th{color:var(--mut);font-size:.78rem;text-transform:uppercase;letter-spacing:.05em}tr:last-child td{border-bottom:0}
hr{border:0;border-top:1px solid var(--bd);margin:32px 0}footer{margin-top:56px;color:var(--mut);font-size:.88rem;border-top:1px solid var(--bd);padding-top:16px}
:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
@media (max-width:860px){.layout{grid-template-columns:1fr}nav.side{position:static;height:auto;border-right:0;border-bottom:1px solid var(--bd)}.toc ol{columns:1}}
@media print{nav.side,.skip{display:none}.layout{display:block}}`;

const files = (await readdir(dir)).filter(f => /^\d\d-.*\.md$/.test(f)).sort();
const pages = [];
for (const f of files) {
  const md = await readFile(join(dir, f), 'utf8');
  pages.push({ f, title: (md.match(/^#\s+(.*)$/m) || [, f])[1].replace(/`/g, ''), md });
}
const evidencePath = join(dir, 'evidence', 'evidence.md');
try { pages.push({ f: 'evidence/evidence.md', title: 'Evidence (generated)', md: await readFile(evidencePath, 'utf8'), nested: true }); } catch { /* evidence not built yet */ }

for (const p of pages) {
  const { html, toc } = render(p.md);
  const prefix = p.nested ? '../' : '';
  const nav = pages.map(q => { const href = q.nested ? 'evidence/evidence.html' : q.f.replace(/\.md$/, '.html'); return `<a href="${prefix}${href}"${q === p ? ' aria-current="page"' : ''}>${esc(q.title)}</a>`; }).join('');
  const tocHtml = toc.length > 3 ? `<nav class="toc" aria-label="On this page"><strong>On this page</strong><ol>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol></nav>` : '';
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><meta name="description" content="${esc(p.title)} — ProtocolSutra AI documentation"><title>${esc(p.title)} · ProtocolSutra AI</title><style>${CSS}</style></head><body><a class="skip" href="#main">Skip to content</a><div class="layout"><nav class="side" aria-label="Documentation"><div class="brand">ProtocolSutra AI</div><div class="tag">v${esc(pkg.version)} · Connect. Validate. Prove.</div>${nav}</nav><main id="main">${html.replace(/(<\/h1>)/, `$1${tocHtml}`)}<footer>ProtocolSutra AI ${esc(pkg.version)} · Created by Vatsal Shah · Apache-2.0 · Generated from <code>${esc(basename(p.f))}</code>. Offline evaluation tool; not an official MCP/A2A conformance suite.</footer></main></div></body></html>`;
  await writeFile(join(dir, p.f.replace(/\.md$/, '.html')), page);
  console.log('built', p.f.replace(/\.md$/, '.html'));
}
