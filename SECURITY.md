# Security Policy

## Supported versions
Security fixes are provided for the latest minor release (currently 0.2.x).

## Reporting a vulnerability
Use **GitHub private vulnerability reporting**: Repository, Security tab, "Report a vulnerability"
(https://github.com/shahvatsalofficial/protocolsutra/security/advisories/new).
Do not open public issues for exploitable bugs and do not include real credentials in any report.
Target: acknowledgement within 5 working days; fix or mitigation plan within 30 days for confirmed issues.

## Scope
In scope: path or symlink escapes in `install-skills`, authentication bypass in `serve`, report HTML injection, redaction failures for supported secret formats, capsule verification bypass, policy/SSRF screening bypass that contradicts documented behaviour.
Out of scope: evasion of the heuristic poisoning detector by paraphrase or encoding (documented limitation; contribute a corpus case instead), issues in third-party software, social engineering.

## Security model summary
Inputs (MCP snapshots, A2A cards, traces, calls) are **untrusted data**. The core evaluator performs no network calls, spawns no processes and executes no tools. Reports escape all dynamic text, ship a restrictive CSP and contain no scripts. `serve` listens on 127.0.0.1 only and requires a bearer token of at least 16 characters.

## Known limitations
Redaction is pattern-based best effort, not data-loss prevention. The audit is heuristic. URL screening is static (no DNS resolution). Capsule HMAC is a shared-secret tag, not a public-key signature. No security certification is provided. Full detail: documents/protocolsutra/06-security-and-threat-model.md
