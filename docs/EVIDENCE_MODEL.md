# Evidence Model

The exact source artifact is identified by SHA-256 digest. Rules produce stable finding IDs derived from rule/path/message. JSON reports are machine-readable, Markdown is human-readable and HTML escapes embedded content.

Outcomes:
- **PASS** — no errors in the scoped deterministic check, or all imported replay assertions satisfied; not full protocol conformance.
- **REVIEW** — structural warnings need human review.
- **NO_GO** — one or more observed rule violations or mismatches.
- **INCONCLUSIVE** — missing observations, absent test cases, or unexecuted steps.
- **reported-pass** — user-imported claimed success with run IDs, not independently verified live host success.
- **untested** — no sufficient evidence to claim compatibility.

Always include protocol version and environment when available. Do not infer correctness from marketing text or a tool's self-described permissions. Persist redacted recordings only after explicit user review.
