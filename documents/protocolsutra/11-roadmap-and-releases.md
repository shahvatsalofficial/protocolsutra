# Roadmap and Releases

## Release history

| Version | Highlights |
|---|---|
| 0.2.0 | New commands `audit`, `diff`, `policy`, `regression`, `gate`, `capsule`, `fixture`; Markdown + HTML + JSON reports from every command (`--format all`); canonical digests; wider secret redaction; SSRF screening; labelled benchmark; evidence generator; full documentation set; cross-platform test runner; CI matrix and publish workflow |
| 0.1.0 | Offline starter: `validate`, `replay`, `matrix`, `install-skills`, `serve`, `doctor`, 18 skills |

## Next milestones (not yet built, not promised dates)

| Milestone | Scope | Exit criterion |
|---|---|---|
| P1 — Live MCP slice | Official MCP TypeScript SDK client plus fixture server, local stdio and Streamable HTTP, recorded observations | Report with `executedLive: true`, version-specific assertions, no network beyond loopback |
| P2 — Live A2A slice | Agent Card discovery, task lifecycle, bindings, negative auth cases | Documented covered and uncovered requirements |
| P3 — Capsule v2 | Public-key signatures, redaction policies, import | Signature verification test with key rotation |
| P4 — Sandboxed runner | Container or process isolation, egress allow-list, DNS-aware SSRF | Negative security test suite |
| P5 — Dashboard | Accessible web UI over real reports | Browser and accessibility tests on shipped UI only |
| SARIF / JSON Schema | Ajv-based full schema validation, SARIF export | Official JSON Schema test-suite results |

## How the project decides

A feature ships only when it runs, has positive and negative tests, documents its limits, and its claims match the evidence. Roadmap items stay labelled "planned" until then.

## Release process

1. `npm test` and `npm run evidence` pass locally.
2. Update `CHANGELOG.md`, `docs/STATUS.md` and the evidence files.
3. Tag `vX.Y.Z`; the release workflow runs the test matrix, packs the tarball, publishes to npm with provenance and creates the GitHub release with sample reports and evidence attached.
4. The maintainer verifies the npm page and a clean `npx protocolsutra --version`.

## Contributing

Good first contributions: a mislabelled or missed case for the benchmark corpus, a new snapshot fixture that exposes a bug, a clearer error message, a doc fix. See `CONTRIBUTING.md`.
