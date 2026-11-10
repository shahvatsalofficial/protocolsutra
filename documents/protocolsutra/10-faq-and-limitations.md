# FAQ and Limitations

## Frequently asked questions

### Is this an official MCP or A2A conformance test?
No. It checks ProtocolSutra's own structural profile on captured JSON. For wire-level conformance use the official SDK test suites. ProtocolSutra is meant to sit around them: capture, compare, gate, prove.

### Does it connect to my server?
No. v0.2.0 never opens a connection to a server under test. You capture `tools/list` output (or an Agent Card) and feed the file in.

### Why does `PASS` not mean "safe"?
Because the audit is heuristic and the structural profile is a subset. `PASS` means these checks found nothing blocking.

### Why is `INCONCLUSIVE` an exit code 0 by default?
Back-compatibility with the first release. Use `--strict` in CI to make `REVIEW` and `INCONCLUSIVE` exit 3.

### Can an attacker evade the poisoning detector?
Yes. Paraphrase, other languages and encodings evade it, and the published benchmark includes such cases that it misses. Treat it as a cheap first filter plus a human review prompt.

### What does the capsule signature prove?
That the file is unchanged since export (SHA-256), and, if you use the HMAC key, that it was sealed by someone holding that key. It does not prove the underlying run was honest.

### Does it send telemetry?
No.

### Which IDEs are supported?
Skills are installed to the documented project-local directory of Claude Code, Cursor, Codex, Gemini CLI and GitHub Copilot. Only file copying is tested; whether each IDE activates the skills has not been verified.

### Why no TypeScript or Ajv?
Zero dependencies keeps the supply chain minimal. Full JSON-Schema validation with Ajv, and a TypeScript migration, are roadmap items.

## Known limitations

| Area | Limitation |
|---|---|
| Live testing | No MCP/A2A live runner; no stdio or Streamable HTTP client |
| Schema validation | Only the root-level shape of tool schemas; no `$ref`, `oneOf` or format checks |
| Detection | Regex-based; English-centric; misses paraphrase and encoding |
| SSRF | Static URL syntax only; no DNS resolution, redirects or rebinding checks |
| Redaction | Pattern-based, best effort, not DLP |
| Signatures | HMAC (shared secret) only; no public-key signatures |
| Hosts | IDE activation of skills unverified |
| Platforms | Primary development on Windows; Linux and macOS covered by CI |
| Benchmark | 32 hand-labelled synthetic cases, optimistic on the author-written subset |
| Protocol versions | MCP `2026-07-28` and A2A `1.0` are *structural subsets* based on selected elements; re-check official specs before relying on them |

## Getting help

Open a GitHub issue with the (redacted) input and the report. For security problems, use a private advisory, not a public issue.
