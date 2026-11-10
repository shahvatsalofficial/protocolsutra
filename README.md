# ProtocolSutra AI

**Offline MCP & A2A interoperability lab — validate snapshots, audit tool poisoning, diff contracts, replay traces, gate releases.**  
*Connect. Validate. Prove.* · Created by **Vatsal Shah** · Apache-2.0

[![CI](https://github.com/shahvatsalofficial/protocolsutra/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/protocolsutra/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/protocolsutra)](https://www.npmjs.com/package/protocolsutra)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)](package.json)
[![node](https://img.shields.io/badge/node-%E2%89%A520-339933)](package.json)

ProtocolSutra AI helps people who build or run **Model Context Protocol (MCP)** servers and **Agent2Agent (A2A)** agents answer three questions with *evidence instead of opinion*:

1. **Did my tool contract break?** — breaking-change diff between two MCP tool snapshots.
2. **Is this server's metadata hostile?** — heuristic scan for tool poisoning, hidden Unicode, leaked secrets, unsafe schemas.
3. **Can I prove it?** — deterministic reports in **JSON, Markdown and self-contained HTML**, SHA-256 sealed evidence capsules, and a CI gate where the worst result wins.

No network. No API key. No model subscription. No runtime dependencies. Node.js 20+.

> [!IMPORTANT]
> ProtocolSutra evaluates **captured files**. It does not connect to live servers, execute tools, or certify protocol conformance. See [What it does not do](#what-it-does-not-do).

## Quick start

```bash
npx protocolsutra fixture create --kind mcp --out snapshot.json
npx protocolsutra validate --input snapshot.json
npx protocolsutra audit --input snapshot.json --format all --out audit-report
```

`--format all` writes `audit-report.json`, `audit-report.md` and `audit-report.html` (open the HTML in any browser; it works offline and contains no scripts).

## Commands

| Command | Purpose | Evidence class |
|---|---|---|
| `validate` | Structural profile for MCP snapshots and A2A Agent Cards | Structural |
| `audit` | Tool-poisoning, secrets, high-impact tools, unsafe schemas | Heuristic |
| `diff` | Breaking changes between two MCP snapshots | Structural |
| `replay` | Recorded JSON-RPC traces; permission-bypass detection | Imported recording |
| `matrix` | Host × protocol × version summary; never "verified" | Reported |
| `policy` | Allow/deny one tool call (path traversal, SSRF, allow-lists) | Local policy |
| `regression` | New findings between two saved reports | Structural |
| `gate` | Combine reports; worst result wins; CI exit codes | Aggregation |
| `capsule export/verify` | Redacted, SHA-256 (+HMAC) sealed evidence package | Integrity |
| `fixture create` | Synthetic fixtures (no credentials) | Utility |
| `install-skills` | 18 Agent Skills into `.claude/.cursor/.agents/.gemini/.github` | Utility |
| `serve` | Localhost, bearer-token, read-only report server | Utility |

Exit codes: `0` ok · `1` usage/runtime error · `2` `NO_GO`/`DENY` · `3` `REVIEW`/`INCONCLUSIVE` with `--strict`.

## Example: catching a poisoned tool

```bash
npx protocolsutra audit --input fixtures/audit/poisoned.json --format all --out poisoned-report
```

Result: `NO_GO` with `TP_IGNORE_INSTRUCTIONS`, `TP_HIDDEN_DIRECTIVE`, `TP_EXFIL_DIRECTIVE`, `TP_SECRET_ACCESS`, `TP_CONCEAL`, `TP_HIDDEN_UNICODE`, `TOOL_HIGH_IMPACT_NAME` and `ANNOTATION_NAME_CONFLICT`. Ready-made samples are in [`examples/reports/`](examples/reports/) (JSON, MD and HTML for each).

## Proof, not promises

| Evidence | Result (v0.2.0) | Reproduce |
|---|---|---|
| Automated tests | 121 passing | `npm test` |
| Policy / SSRF adversarial calls | 12 of 12 denied, 2 of 2 legitimate allowed | `npm run evidence` |
| Tool-poisoning heuristic on 32 labelled descriptions | recall 12/16 malicious (75 %), 1 false alarm in 16 benign; **the 4 misses are deliberate evasions** | `npm run evidence` |
| Sample reports | deterministic; `git diff examples/` is empty after `npm run demo` | `npm run demo` |
| CI | Linux, macOS, Windows × Node 20/22 | [Actions](https://github.com/shahvatsalofficial/protocolsutra/actions) |

The benchmark is small, synthetic and partly author-written. Intervals are wide and the detector is regex-based; both are stated in [Evidence and methodology](documents/protocolsutra/07-evidence-and-methodology.md). Numbers come from `scripts/build-evidence.mjs`, not from hand-typed claims.

## What it does not do

- It does **not** contact a live MCP server or A2A agent and does **not** execute tools.
- It is **not** an official conformance suite; it holds no certification from the MCP or A2A projects and is not affiliated with them.
- `PASS` means "nothing blocking found by these checks", never "secure" or "compliant".
- Detection is heuristic. Paraphrase, other languages and encodings evade it.
- Skill installation copies files; whether your IDE activates them is not verified.

Full list: [FAQ and limitations](documents/protocolsutra/10-faq-and-limitations.md).

## Use as a library

```js
import { auditSecurity, diffSnapshots, releaseGate, htmlReport } from 'protocolsutra';
const report = auditSecurity(snapshot);
console.log(report.gate, htmlReport(report).length);
```

## CI example

```yaml
- run: npx protocolsutra@latest audit --input snapshot.json --format all --out reports/audit --strict
- uses: actions/upload-artifact@v4
  if: always()
  with: { name: protocolsutra-reports, path: reports/ }
```

## Documentation

Detailed, browsable docs (Markdown + designed HTML) live in [`documents/protocolsutra/`](documents/protocolsutra/00-start-here.md): executive summary, functional guide, user guide, architecture, technical reference and rule catalog, security and threat model, evidence and methodology, legal notes, agents and skills, FAQ, roadmap. Regenerate HTML with `npm run docs`.

## Agent skills

18 specialist skills (`skills/`, Agent Skills format) and Claude Code subagent files (`agents/`) let an AI assistant drive the CLI safely: Prime, MCP Sentinel, A2A Navigator, Contract Lens, Tool Auditor, Transport Doctor, Auth Guardian, Permission Guard, Replay Lab, Fixture Smith, Trace Forensics, Version Map, Compatibility Grid, Interoperability Bench, Drift Watch, Evidence Keeper, Security Shield, Release Gate. See [Agents and skills](documents/protocolsutra/09-agents-and-skills.md).

## Roadmap

Live MCP and A2A slices using the official SDKs, sandboxed runner, public-key capsule signatures, SARIF and a dashboard. All are *planned*; none is claimed. See [ROADMAP.md](ROADMAP.md).

## Security

Report vulnerabilities privately via GitHub Security Advisories ([SECURITY.md](SECURITY.md)). Never commit real tokens.

## License and attribution

Apache-2.0, see [LICENSE](LICENSE) and [NOTICE](NOTICE). Created and maintained by **Vatsal Shah**. "MCP", "A2A" and IDE/product names belong to their respective owners; this project is independent and not endorsed by them.

<!-- Search keywords: MCP validator, Model Context Protocol security audit, MCP tool poisoning scanner, A2A agent card validator, agent interoperability testing, MCP contract diff, AI agent CI gate, offline MCP linter, JSON-RPC replay, evidence capsule -->
