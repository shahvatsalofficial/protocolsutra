# Security and Threat Model

## Security posture

ProtocolSutra reads files and writes reports. By default it opens no sockets, spawns no processes and executes nothing it reads. The only network-facing component is the optional `serve` command, bound to `127.0.0.1`.

## Assets and threats

| Asset | Threat | Control implemented | Residual risk |
|---|---|---|---|
| Developer credentials | Secrets pasted into snapshots or traces | Redaction of bearer tokens, GitHub/AWS/npm/Google/Slack tokens, JWTs, URL credentials, private-key blocks; `SECRET_IN_TEXT` finding; secret-scan test over the repository | Pattern-based; unknown formats are not caught. Not DLP |
| Reviewer / downstream model | Prompt injection through tool text in a report | HTML escaping everywhere; CSP `default-src 'none'`; no scripts; findings quote text but reports are data | A human or model reading raw JSON still sees hostile text |
| Host machine | Hostile tool or server | Nothing is executed; replay is data only | A future live runner needs sandboxing (not built) |
| Filesystem | Symlink or path traversal on install | Refuses symlinked ancestors and targets; no overwrite without `--force` | Race between check and write (TOCTOU) is possible in theory |
| Local report server | Unauthenticated access | `127.0.0.1` only, bearer token ≥ 16 chars, timing-safe compare, GET only, `no-store` | Anyone on the same machine with the token can read the report |
| Evidence integrity | Tampered report | SHA-256 over canonical JSON; optional HMAC | Integrity only; HMAC key sharing means shared signing power |
| Release decisions | False pass | Worst-result-wins gate; missing evidence is `INCONCLUSIVE` | Gate is only as good as the reports supplied |
| Outbound requests (future) | SSRF | Static screening of URLs in `policy` | No DNS resolution: DNS rebinding must be handled by a runtime |

## Hardening choices

- Zero runtime dependencies: no transitive packages to compromise.
- Inputs are bounded: depth, array length, string length, tool and case counts.
- JSON only: no `eval`, no dynamic `require`, no YAML parsing.
- Reports never include timestamps or machine paths, so they diff cleanly and leak little.
- Release workflow publishes with npm provenance and pins GitHub Actions to major versions.

## What is explicitly out of scope

Sandboxing of live servers, authentication flows, DNS-aware SSRF defence, multi-tenant hosting, signed (public-key) artifacts and telemetry. These are listed on the roadmap and are **not** claimed.

## Responsible disclosure

Report vulnerabilities privately through GitHub Security Advisories on the repository (see `SECURITY.md`). Do not open public issues for exploitable bugs. Target: acknowledgement within 5 working days.

## Secrets hygiene for contributors

Never commit real tokens. If a token is ever pasted into a chat, ticket or log, treat it as exposed: revoke it immediately and create a new one with the minimum scope.
