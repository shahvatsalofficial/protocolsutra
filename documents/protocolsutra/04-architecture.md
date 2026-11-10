# Architecture

## Design goals

1. **Offline and deterministic.** Same input, same output, same digest.
2. **Zero runtime dependencies.** Node.js built-ins only, so the supply-chain surface is the project itself.
3. **Pure core, thin shell.** Evaluation logic is pure functions over parsed JSON; file and network I/O lives only in the CLI, installer and server.
4. **Honest states.** The type of every verdict carries its evidence class.

## Data flow

```text
captured JSON (snapshot / card / suite / evidence / policy+call)
        |
        v
  readJSON  --->  evaluator (pure)  --->  sanitize (redact)  --->  report model
                                                                     |
                                   +-------------+-------------------+
                                   v             v                   v
                                 JSON          Markdown        self-contained HTML
                                   |
                                   +--> capsule (digest/HMAC)  --> verify
                                   +--> gate (worst result wins) --> CI exit code
```

## Modules

| Module | Responsibility | I/O |
|---|---|---|
| `packages/core/validate.mjs` | Structural profiles for MCP snapshot and A2A card | none |
| `packages/core/audit.mjs` | Heuristic security audit | none |
| `packages/core/diff.mjs` | Contract diff and report-to-report regression | none |
| `packages/core/replay.mjs` | JSON-RPC pair checks and replay suites | none |
| `packages/core/matrix.mjs` | Imported-evidence matrix | none |
| `packages/core/policy.mjs` | Deny-by-default tool-call decision | none |
| `packages/core/ssrf.mjs` | Static URL screening | none |
| `packages/core/capsule.mjs` | Redact, digest, optional HMAC, verify | none |
| `packages/core/gate.mjs` | Aggregate verdicts | none |
| `packages/core/fixture.mjs` | Synthetic fixtures | none |
| `packages/core/report.mjs` | Markdown and HTML rendering (escaped, CSP, no scripts) | none |
| `packages/core/utils.mjs` | Canonical JSON, digest, redaction, helpers | file read/write helpers |
| `packages/core/installer.mjs` | Project-local skill installation with symlink refusal | filesystem |
| `packages/server/index.mjs` | Localhost, bearer-token, read-only report server | HTTP on 127.0.0.1 |
| `packages/cli/index.mjs` | Argument parsing, formats, exit codes | filesystem, stdout |
| `packages/core/index.mjs` | Public programmatic API | none |

Dependency direction: `cli` and `server` depend on `core`; `core` depends on nothing but Node built-ins.

## Key decisions (ADR summary)

| # | Decision | Why | Consequence |
|---|---|---|---|
| 1 | Plain ESM `.mjs`, no build step | Runs from a clean checkout; nothing to compile or trust | No static types yet; JSON Schemas and tests carry the contract |
| 2 | Canonical JSON before hashing | Key order must not change a digest | Digests are stable across tools and machines |
| 3 | Worst result wins in the gate | A blocking failure must not be averaged away | Conservative: one `INCONCLUSIVE` blocks a `GO` |
| 4 | Missing observation is `INCONCLUSIVE` | Absence of evidence is not a pass | More `INCONCLUSIVE` results, fewer false confidences |
| 5 | Snapshot format is ProtocolSutra's own | Wire capture needs a live runner that is not built yet | Reports state clearly it is not conformance |
| 6 | Policy ignores tool annotations | A server must not authorise itself | `readOnlyHint` is reported but never trusted |
| 7 | HMAC, not public-key signatures | No key management in an offline tool | Integrity only; sharing the key shares signing power |
| 8 | HTML reports have no script and a restrictive CSP | Reports contain untrusted tool text | Static tables, no sorting widgets |
| 9 | Static URL screening only | DNS resolution needs network access | Runtime must re-check resolved IPs |

## Trust boundaries

Everything read from a snapshot, card, trace or call is **untrusted data**. It is parsed, bounded (depth, array length, string length, tool count) and escaped on output. It is never executed, evaluated or used to select a file path.

## Extension points (planned)

- A live MCP/A2A runner that produces the same report shape (`executedLive: true`).
- SARIF export for code-scanning dashboards.
- Official SDK/TCK result importers.

These are roadmap items, not shipped features. See [Roadmap](11-roadmap-and-releases.md).
