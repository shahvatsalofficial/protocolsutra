# Executive Summary

## The problem

Teams adopting MCP and A2A face three recurring risks:

1. **Silent breakage.** A tool's input schema changes and agents that call it start failing, with no signal until production.
2. **Poisoned tool metadata.** Tool descriptions are read by language models. A hostile or compromised server can embed instructions in them (tool poisoning, "rug pull" updates).
3. **Unprovable claims.** "Works with Cursor", "secure by design" and "compliant" are asserted far more often than demonstrated.

## The answer

ProtocolSutra AI gives engineers a small, auditable, offline tool that produces **evidence** rather than opinions. Inputs are captured JSON files; outputs are deterministic reports with content digests, so a second person can re-run the check and get the same result.

## Why it is trustworthy

| Principle | How it is enforced |
|---|---|
| No false confidence | Four distinct non-pass states: `REVIEW`, `INCONCLUSIVE`, `NO_GO`, plus `NOT_RUN`. A missing observation is never a pass. |
| Worst result wins | The release gate never averages a blocking failure away. |
| Offline by default | No network, no subprocess, no tool execution, no API key, no telemetry. |
| Labelled evidence | Each finding says whether it is normative-structural, heuristic, imported or local policy. |
| Reproducible | Canonical SHA-256 digests; `npm run evidence` regenerates every published number. |
| Honest limits | Detection is regex-based; the benchmark includes deliberate evasions that it misses. |

## Measured results (v0.2.0, this repository)

See [Evidence and methodology](07-evidence-and-methodology.md) for the full, regenerated numbers. Headline: 121 automated tests pass on the author's Windows machine; CI runs a Linux/macOS/Windows × Node matrix on GitHub; the policy/SSRF boundary denied 12 of 12 adversarial calls while allowing 2 of 2 legitimate ones; the tool-poisoning heuristic detected 12 of 16 malicious descriptions (all 4 misses are intentional evasions) with 1 false alarm on 16 benign ones.

## Business value

- **Release safety:** one CI command (`gate --strict`) blocks a release on breaking contract changes or poisoned metadata.
- **Audit trail:** hash-sealed capsules can be attached to tickets and reviews.
- **Cost:** zero dependencies, no accounts, no model subscription. Runs on Node 20+.

## Risk and limitations in one paragraph

ProtocolSutra evaluates **captured files**, not live systems. It is not a substitute for the official MCP/A2A test suites, penetration testing or a security review. Heuristic findings are leads for a human, and a clean audit is not proof of safety. The project makes no certification, compliance or endorsement claims.

## Decision guide

| If you need… | Use ProtocolSutra? |
|---|---|
| A fast CI gate on snapshot contracts and poisoned descriptions | Yes |
| Evidence you can hand to a reviewer | Yes (capsules + HTML reports) |
| Proof a server conforms to the MCP/A2A specification | No — use the official SDK test suites; ProtocolSutra can wrap their output later |
| Runtime protection of a live agent | No — enforce policy in your runtime; `policy` shows reference logic |
