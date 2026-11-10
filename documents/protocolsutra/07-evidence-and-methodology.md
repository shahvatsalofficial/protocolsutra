# Evidence and Methodology

Trust comes from being able to check. This page explains how every number is produced. The generated figures live in [Evidence (generated)](evidence/evidence.md) and are rewritten by one command:

```bash
npm run evidence
```

## What is measured

| Evidence | Source | Reproduce |
|---|---|---|
| Automated test results | `scripts/run-tests.mjs` (Node test runner) | `npm test` |
| Tool-poisoning detection quality | `fixtures/benchmark/audit-corpus.json` (32 labelled descriptions) | `npm run evidence` |
| Boundary self-checks | 12 adversarial policy/SSRF calls + 2 legitimate calls | `npm run evidence` |
| Sample reports | `examples/reports/*.{json,md,html}` | `npm run demo` |
| CI matrix | GitHub Actions runs (Linux, macOS, Windows × Node 20/22) | See the repository Actions tab |

## Benchmark method

1. Descriptions were labelled `malicious` or `benign` by hand.
2. Each is wrapped in a one-tool snapshot and passed to `auditSecurity`.
3. A description counts as *flagged* if it yields an `error`-level `TP_*` or `SECRET_IN_TEXT` finding.
4. Precision, recall, false-positive rate and a 95 % Wilson interval are computed from the confusion matrix.

## Why you should not over-trust the benchmark

- The first 28 cases were written by the same person who wrote the detection rules, so results on them are optimistic.
- Four cases (`e01`–`e04`) are **deliberate evasions** — paraphrase, Spanish, base64, indirect phrasing. The detector misses all four. They are published on purpose: a regex detector can be evaded, and the report should say so.
- The corpus is small (32), so confidence intervals are wide.
- It is not a random sample of real MCP servers. Do not quote the numbers as real-world accuracy.

## Known false alarm

`b14` ("Never reveal data belonging to other users") is flagged by `TP_CONCEAL` because it resembles a concealment instruction. It is kept in the corpus as a documented false positive.

## What each claim rests on

| Claim | Supported by | Not supported by |
|---|---|---|
| "Detects common injection phrasing" | Benchmark true positives | Paraphrase or encoded attacks |
| "Blocks path traversal and SSRF syntax" | 12/12 adversarial policy cases plus unit tests | DNS rebinding, redirects, TOCTOU |
| "Reports are tamper-evident" | Capsule tamper tests | Proof of honest production |
| "Works on Linux/macOS/Windows" | CI matrix run results | Local runs on a single OS |
| "Conforms to MCP/A2A" | **Nothing** — not claimed | — |

## Independent verification checklist

1. Clone the repository at the release tag.
2. `npm test` — expect all tests to pass.
3. `npm run evidence` — compare the figures with the published file.
4. `npm run demo`, then `git diff examples/` — expect no change (reports are deterministic).
5. Read `packages/core/audit.mjs`: every pattern is in one file, about 100 lines.

## Reporting a wrong result

Open an issue with the input file (redacted) and the report. A reproducible false positive or false negative becomes a new labelled corpus case, which is how the benchmark should grow.
