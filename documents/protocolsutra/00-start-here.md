# ProtocolSutra AI — Documentation Home

**Connect. Validate. Prove.** Created by Vatsal Shah · Apache-2.0

ProtocolSutra AI is an offline-first, zero-dependency command-line lab for people who build or operate **MCP** (Model Context Protocol) servers and **A2A** (Agent2Agent) agents. It turns "I think this works" into a repeatable, evidence-backed report that anyone can re-run.

## What it does today

| Capability | Command | Evidence class |
|---|---|---|
| Structural check of an MCP snapshot or A2A Agent Card | `validate` | ProtocolSutra local profile |
| Heuristic security audit (tool poisoning, secrets, unsafe schemas) | `audit` | Heuristic |
| Breaking-change diff between two MCP snapshots | `diff` | Structural |
| Replay of recorded JSON-RPC traces with permission checks | `replay` | Imported recording |
| Reported compatibility matrix | `matrix` | Reported, never verified |
| Allow/deny decision for one tool call (path traversal, SSRF) | `policy` | Deterministic local policy |
| Regression between two saved reports | `regression` | Structural |
| Worst-result-wins release gate for CI | `gate` | Aggregation |
| Redacted, hash-sealed evidence package | `capsule export` / `capsule verify` | Integrity only |
| Fixture generator, skill installer, read-only report server | `fixture create`, `install-skills`, `serve` | Utility |

Every command writes **JSON, Markdown and a self-contained HTML report** (`--format all --out <name>`).

## What it deliberately does not do

- It does **not** contact a live MCP server or A2A agent, and does **not** execute tools.
- It is **not** an official conformance suite and holds **no** certification from the MCP or A2A projects.
- A passing result means "nothing blocking found by these checks within the stated scope", never "secure" or "compliant".

## Reading order

1. [Executive summary](01-executive-summary.md) — for decision makers.
2. [Functional guide](02-functional-guide.md) — what each feature does and does not prove.
3. [User guide](03-user-guide.md) — install, run, CI, reading reports.
4. [Architecture](04-architecture.md) — modules, data flow, design decisions.
5. [Technical reference](05-technical-reference.md) — commands, exit codes, rule catalog, JSON shapes.
6. [Security and threat model](06-security-and-threat-model.md) — boundaries and residual risk.
7. [Evidence and methodology](07-evidence-and-methodology.md) — measured results and how to reproduce them.
8. [Legal and compliance](08-legal-and-compliance.md) — licensing, trademarks, privacy, what we do not claim.
9. [Agents and skills](09-agents-and-skills.md) — the 18 specialist skills.
10. [FAQ and limitations](10-faq-and-limitations.md) — honest answers.
11. [Roadmap and releases](11-roadmap-and-releases.md) — what is next and what is not promised.

## Quick start

```bash
npx protocolsutra fixture create --kind mcp --out snapshot.json
npx protocolsutra validate --input snapshot.json
npx protocolsutra audit --input snapshot.json --format all --out audit-report
```

The last command writes `audit-report.json`, `audit-report.md` and `audit-report.html`.
