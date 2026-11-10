# Functional Guide

Each feature below states **what it checks**, **what it proves** and **what it cannot prove**.

## Evidence classes

| Class | Meaning |
|---|---|
| Structural | A shape rule on a captured document (required field, duplicate name, schema root type). |
| Heuristic | A pattern match. A hit is a lead for human review; a miss proves nothing. |
| Imported | Taken from a recording or report supplied by someone else. Not independently verified. |
| Local policy | A deterministic ProtocolSutra rule (for example "deny paths outside the workspace"). |

## validate

Checks an `mcp-snapshot` (a ProtocolSutra capture format, **not** an MCP wire message) or an `a2a-agent-card`.

- MCP: explicit `protocolVersion`, server `name`, `tools` array, unique tool names, JSON-Schema root `type: object`, `required` fields declared, `outputSchema` shape, credentials in the snapshot.
- A2A: name, version, explicit protocol version, at least one `supportedInterfaces` entry with `url` and `protocolBinding`, unique skill ids, `securitySchemes` shape, plaintext remote URLs.
- Proves: the document is well-formed for the profile. Cannot prove: the server actually implements the protocol.

## audit

Heuristic security review of the same two input kinds.

- Tool-poisoning patterns: override-prior-instructions, pseudo-system tags, exfiltration directives, secret-file access, concealment from the user, invisible/bidirectional Unicode, oversized text.
- Secrets in text, high-impact tool names (`exec`, `shell`, `delete`…), `readOnlyHint` that contradicts a dangerous name, unconstrained path/command/URL strings, missing `additionalProperties: false`.
- A2A: no security schemes, plaintext remote interface.
- Cannot prove safety: paraphrase, other languages and encodings evade it (see the benchmark).

## diff

Compares two `mcp-snapshot` files and classifies changes.

| Change | Severity |
|---|---|
| Tool removed | error |
| Input property removed / type changed / enum narrowed | error |
| New required input, or existing input became required | error |
| Optional input added, requirement relaxed, tool added | info |
| Description changed | info — re-audit (rug-pull risk) |
| `readOnlyHint` dropped | warning |

## replay

Evaluates recorded JSON-RPC 2.0 request/response pairs against expectations (`success`, `error`, `denied`).

- No recorded response → `INCONCLUSIVE`, never a pass.
- A disallowed tool that returned a success result → `PERMISSION_BYPASS` → `NO_GO`.
- Mismatched ids, malformed errors, result-subset mismatches and duplicate case ids fail.
- It replays **data**; nothing is executed.

## matrix

Summarises imported host/protocol/version evidence. A "pass" without a run id and case id is downgraded. Every status is `reported-*` or `untested`; nothing is "verified" unless produced by a future live runner.

## policy

Given a policy and one tool call, returns `ALLOW` or `DENY` with reason codes. Deny-by-default; `deniedTools` beats `allowedTools`; path arguments are normalised and must stay inside `pathRoots`; URL arguments are screened for non-HTTP schemes, embedded credentials, loopback, private ranges, cloud metadata, obfuscated hosts and non-allow-listed hosts. Tool annotations are ignored on purpose.

Limit: it checks URL syntax only. It does not resolve DNS, so a runtime must also re-check the resolved address (DNS-rebinding defence).

## regression

Takes two saved reports and lists findings that are new in the second. Fixed findings are counted.

## gate

Combines any number of reports. Worst result wins: `NO_GO` > `INCONCLUSIVE` > `REVIEW` > `PASS`. A report without a gate is `INCONCLUSIVE`. No reports at all is `INCONCLUSIVE`. `--allow-review` accepts warnings.

## capsule

`capsule export` redacts secrets and seals the report with a SHA-256 digest (and an HMAC-SHA256 tag if `PROTOCOLSUTRA_SIGNING_KEY` is set). `capsule verify` recomputes it. The seal proves the file is unchanged since export. It does **not** prove the evidence was honestly produced, and HMAC is a shared-secret tag, not a public-key signature.

## fixture, install-skills, serve

- `fixture create` writes synthetic fixtures (`example.invalid` hosts, no credentials).
- `install-skills` copies the 18 skills into a host's project-local skills directory, refuses to overwrite without `--force`, and refuses symlinked paths. It does not prove the host will activate them.
- `serve` exposes one report on `127.0.0.1` with a bearer token (minimum 16 characters). It is not an MCP or A2A gateway.
