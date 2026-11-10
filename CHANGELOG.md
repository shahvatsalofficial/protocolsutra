# Changelog

## 0.2.0 — 2026-11-10
### Added
- `audit`: heuristic security audit (tool poisoning, hidden Unicode, secrets, high-impact tools, unbounded schemas, A2A card gaps).
- `diff`: breaking-change contract diff between two MCP snapshots; `regression`: new findings between two reports.
- `policy`: deny-by-default tool-call decision with path-traversal and SSRF screening.
- `gate`: worst-result-wins release gate; `--strict` makes REVIEW/INCONCLUSIVE exit 3.
- `capsule export|verify`: redacted, SHA-256 sealed (optional HMAC-SHA256) evidence package.
- `fixture create`, `--version`, `--format all`; unified JSON/Markdown/HTML output for every command.
- Designed, accessible, self-contained HTML reports (light/dark, CSP, no scripts, no external assets).
- Labelled benchmark corpus and `npm run evidence` generator; `npm run docs` documentation builder.
- Documentation set in `documents/protocolsutra/` (Markdown + HTML), README, SECURITY, SUPPORT, NOTICE, CITATION, llms.txt.
- Programmatic API (`import … from 'protocolsutra'`).
- Release workflow with npm provenance; CI matrix for Linux, macOS, Windows × Node 20/22.

### Changed
- Digests are key-order independent (canonical JSON).
- Wider secret redaction (AWS, JWT, Slack, npm, Google, GitHub token families, URL credentials, private keys).
- Test runner is cross-platform (`scripts/run-tests.mjs`), fixing glob expansion failures on Windows CI.
- The symlink test skips (not fails) when the OS account may not create symlinks.

### Known limits
- No live MCP/A2A runner; heuristic detection is evadable; see FAQ and limitations.

## 0.1.0 — 2026-11-10
Initial offline-first starter: structural validation, recorded replay, reported matrix, 18 skills, localhost report server.
