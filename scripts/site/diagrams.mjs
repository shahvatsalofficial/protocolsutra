// Inline SVG diagrams and charts. Colours come from CSS variables so every figure follows the light/dark theme.
import { escapeHTML as esc } from '../../packages/core/safe-html.mjs';

let uid = 0;
const defs = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1l8 4-8 4z" class="d-head"/></marker></defs>`;

export const ICONS = {
  shield: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  diff: '<path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  replay: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  gate: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10l3 2-3 2M12 15h5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  package: '<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  trend: '<path d="M4 17l5-5 4 4 7-8M15 8h5v5"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>',
  moon: '<path d="M20 14.500A8 8 0 1 1 9.500 4 6.500 6.500 0 0 0 20 14.500z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  scale: '<path d="M12 4v16M6 20h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>'
};
export const icon = (name, size = 24) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const cap = (label, alt) => `<figcaption>${esc(label)}</figcaption>`;
function wrap(inner, label, alt) {
  return `<figure class="dia" role="group" aria-label="${esc(alt || label)}">${inner}${cap(label)}</figure>`;
}

/** Linear flow: horizontal on desktop, vertical on phones (both rendered, CSS picks one). */
export function flow(steps, label, alt) {
  const n = steps.length;
  const bw = 150, bh = 78, gap = 40, pad = 14;
  const W = n * bw + (n - 1) * gap + pad * 2, H = bh + pad * 2 + 18;
  const id = `m${++uid}`;
  let h = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${defs(id)}`;
  steps.forEach((s, i) => {
    const x = pad + i * (bw + gap), y = pad + 10;
    h += `<g><rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" class="d-box k-${s.k || 'neutral'}"/>`;
    h += `<text x="${x + bw / 2}" y="${y + 33}" text-anchor="middle" class="d-t">${esc(s.t)}</text>`;
    if (s.s) h += `<text x="${x + bw / 2}" y="${y + 55}" text-anchor="middle" class="d-s">${esc(s.s)}</text>`;
    h += `<circle cx="${x + 12}" cy="${y}" r="11" class="d-num"/><text x="${x + 12}" y="${y + 4}" text-anchor="middle" class="d-n">${i + 1}</text></g>`;
    if (i < n - 1) h += `<line x1="${x + bw + 4}" y1="${y + bh / 2}" x2="${x + bw + gap - 4}" y2="${y + bh / 2}" class="d-line" marker-end="url(#${id})"/>`;
  });
  h += '</svg>';
  const vw = 330, vbh = 64, vgap = 34, vpad = 12;
  const VH = n * vbh + (n - 1) * vgap + vpad * 2;
  const id2 = `m${++uid}`;
  let v = `<svg viewBox="0 0 ${vw} ${VH}" role="img" aria-hidden="true">${defs(id2)}`;
  steps.forEach((s, i) => {
    const x = vpad, y = vpad + i * (vbh + vgap);
    v += `<rect x="${x}" y="${y}" width="${vw - vpad * 2}" height="${vbh}" rx="12" class="d-box k-${s.k || 'neutral'}"/>`;
    v += `<circle cx="${x + 24}" cy="${y + vbh / 2}" r="12" class="d-num"/><text x="${x + 24}" y="${y + vbh / 2 + 4}" text-anchor="middle" class="d-n">${i + 1}</text>`;
    v += `<text x="${x + 48}" y="${y + (s.s ? 27 : 37)}" class="d-t">${esc(s.t)}</text>`;
    if (s.s) v += `<text x="${x + 48}" y="${y + 47}" class="d-s">${esc(s.s)}</text>`;
    if (i < n - 1) v += `<line x1="${vw / 2}" y1="${y + vbh + 3}" x2="${vw / 2}" y2="${y + vbh + vgap - 3}" class="d-line" marker-end="url(#${id2})"/>`;
  });
  v += '</svg>';
  return wrap(`<div class="dia-h">${h}</div><div class="dia-v">${v}</div>`, label, alt || `${label}: ${steps.map(s => s.t).join(', then ')}`);
}

/** Vertical stack of checks; each check can exit to a red DENY pill, survivors reach the green end state. */
export function checks(items, end, label, alt) {
  const W = 440, rowH = 70, pad = 14, boxW = 250, pillX = 296, pillW = 130;
  const H = items.length * rowH + 70 + pad;
  const id = `m${++uid}`;
  let h = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">${defs(id)}`;
  items.forEach((c, i) => {
    const y = pad + i * rowH;
    h += `<rect x="${pad}" y="${y}" width="${boxW}" height="46" rx="10" class="d-box k-neutral"/><text x="${pad + 14}" y="${y + 20}" class="d-t">${esc(c.q)}</text><text x="${pad + 14}" y="${y + 37}" class="d-s">${esc(c.s || '')}</text>`;
    h += `<line x1="${pad + boxW + 4}" y1="${y + 23}" x2="${pillX - 4}" y2="${y + 23}" class="d-line bad" marker-end="url(#${id})"/><text x="${(pad + boxW + pillX) / 2}" y="${y + 17}" text-anchor="middle" class="d-s">no</text>`;
    h += `<rect x="${pillX}" y="${y + 6}" width="${pillW}" height="34" rx="17" class="d-box k-bad"/><text x="${pillX + pillW / 2}" y="${y + 27}" text-anchor="middle" class="d-t sm">${esc(c.deny)}</text>`;
    h += `<line x1="${pad + boxW / 2}" y1="${y + 48}" x2="${pad + boxW / 2}" y2="${y + rowH - 2}" class="d-line" marker-end="url(#${id})"/><text x="${pad + boxW / 2 + 10}" y="${y + 63}" class="d-s">yes</text>`;
  });
  const ey = pad + items.length * rowH;
  h += `<rect x="${pad}" y="${ey}" width="${boxW}" height="46" rx="23" class="d-box k-ok"/><text x="${pad + boxW / 2}" y="${ey + 29}" text-anchor="middle" class="d-t">${esc(end)}</text></svg>`;
  return wrap(h, label, alt || label);
}

/** Result ladder: worst result wins. */
export function ladder(label) {
  const rows = [
    { t: 'PASS / GO', s: 'Nothing blocking in scope', c: 'Exit 0', k: 'ok' },
    { t: 'REVIEW', s: 'Warnings need a human', c: 'Exit 0 · 3 with --strict', k: 'warn' },
    { t: 'INCONCLUSIVE', s: 'Evidence missing, never a pass', c: 'Exit 0 · 3 with --strict', k: 'warn' },
    { t: 'NO_GO / DENY', s: 'Blocking failure', c: 'Exit 2', k: 'bad' }
  ];
  const W = 440, rh = 62, pad = 14, H = rows.length * rh + pad * 2 + 24;
  let h = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">`;
  rows.forEach((r, i) => {
    const y = pad + i * rh, inset = i * 16;
    h += `<rect x="${pad + inset}" y="${y}" width="${W - pad * 2 - inset}" height="50" rx="12" class="d-box k-${r.k}"/>`;
    h += `<text x="${pad + inset + 16}" y="${y + 22}" class="d-t">${esc(r.t)}</text><text x="${pad + inset + 16}" y="${y + 40}" class="d-s">${esc(r.s)}</text>`;
    h += `<text x="${W - pad - 14}" y="${y + 31}" text-anchor="end" class="d-s strong">${esc(r.c)}</text>`;
  });
  h += `<text x="${pad}" y="${H - 8}" class="d-s">Better</text><text x="${W - pad}" y="${H - 8}" text-anchor="end" class="d-s">Worse: the worst input decides the gate</text></svg>`;
  return wrap(h, label, 'Gate result ladder from PASS to NO_GO');
}

/** Architecture layers. */
export function layers(label) {
  const W = 480, H = 330;
  const row = (y, h, k, t, s) => `<rect x="20" y="${y}" width="440" height="${h}" rx="14" class="d-box k-${k}"/><text x="40" y="${y + 28}" class="d-t">${esc(t)}</text><text x="40" y="${y + 48}" class="d-s">${esc(s)}</text>`;
  let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">`;
  g += row(14, 62, 'brand', 'Shell: CLI and localhost report server', 'Reads files · writes reports · sets exit codes');
  g += row(98, 100, 'neutral', 'Core evaluators (pure functions)', '');
  ['validate', 'audit', 'diff', 'replay', 'matrix', 'policy', 'gate', 'capsule'].forEach((n, i) => {
    const x = 40 + (i % 4) * 104, y = 134 + Math.floor(i / 4) * 30;
    g += `<rect x="${x}" y="${y}" width="96" height="24" rx="12" class="d-box k-brand soft"/><text x="${x + 48}" y="${y + 16}" text-anchor="middle" class="d-s">${n}</text>`;
  });
  g += row(220, 62, 'neutral', 'Shared utilities', 'Canonical JSON · SHA-256 · redaction · SSRF screening');
  g += `<rect x="20" y="298" width="440" height="22" rx="11" class="d-box k-ok"/><text x="240" y="313" text-anchor="middle" class="d-s strong">Node.js built-ins only · zero runtime dependencies · no network · no exec</text></svg>`;
  return wrap(g, label, 'Architecture layers: shell, core evaluators, shared utilities');
}

/** Horizontal bar charts computed from real numbers. items: {label, value, total, k, note} */
export function bars(items, label, alt) {
  const W = 480, rh = 46, pad = 14, lw = 150, bw = 220;
  const H = items.length * rh + pad * 2;
  let h = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">`;
  items.forEach((it, i) => {
    const y = pad + i * rh, frac = it.total ? it.value / it.total : 0;
    h += `<text x="${pad}" y="${y + 22}" class="d-s ink">${esc(it.label)}</text>`;
    h += `<rect x="${lw}" y="${y + 8}" width="${bw}" height="18" rx="9" class="d-track"/>`;
    if (frac > 0) h += `<rect x="${lw}" y="${y + 8}" width="${Math.max(18, bw * frac)}" height="18" rx="9" class="d-bar k-${it.k || 'brand'}"/>`;
    h += `<text x="${lw + bw + 12}" y="${y + 22}" class="d-t sm">${esc(it.value)} / ${esc(it.total)}</text>`;
  });
  h += '</svg>';
  return wrap(h, label, alt || label);
}

/** Terminal mock-up (always dark). */
export function terminal(lines) {
  const body = lines.map(l => {
    const cls = l.startsWith('$') ? 't-cmd' : /NO_GO|ERROR|DENY/.test(l) ? 't-bad' : /PASS|GO\b|ALLOW/.test(l) ? 't-ok' : /WARNING|REVIEW/.test(l) ? 't-warn' : 't-out';
    return `<span class="${cls}">${esc(l)}</span>`;
  }).join('\n');
  return `<div class="term" role="img" aria-label="Terminal example"><div class="term-bar"><i></i><i></i><i></i><span>bash</span></div><pre>${body}</pre></div>`;
}
