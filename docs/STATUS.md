# Implementation Status — v0.2.0 (2026-11-10)

## Implemented and locally tested

- Offline, dependency-free Node.js CLI and library: `validate`, `audit`, `diff`, `replay`, `matrix`, `policy`, `regression`, `gate`, `capsule export|verify`, `fixture create`, `install-skills`, `serve`, `doctor`.
- MCP `mcp-snapshot` and A2A `a2a-agent-card` structural profiles (selected elements only, not wire conformance).
- Heuristic security audit with 14 rule families; labelled benchmark with published misses.
- Breaking-change contract diff and report-to-report regression.
- Deny-by-default policy engine with path-traversal and static SSRF screening.
- Recorded JSON-RPC replay with permission-bypass detection; missing observation is `INCONCLUSIVE`.
- Reports in JSON, Markdown and self-contained accessible HTML for every command (`--format all`).
- SHA-256 sealed evidence capsules with optional HMAC-SHA256.
- Worst-result-wins release gate with `--strict` CI exit codes.
- 18 Agent Skills plus Claude subagent files with an integrity test.
- Evidence generator (`npm run evidence`) and documentation set in `documents/protocolsutra/`.

## Verified how

- 121 automated tests (`npm test`) on the author's Windows machine; the symlink test skips when the OS account lacks symlink permission.
- CI matrix (Linux, macOS, Windows × Node 20/22) is configured; read the Actions tab for actual results, not this file.

## Planned / NOT YET implemented

- Live MCP client/server, stdio or Streamable HTTP, official SDK integration.
- Live A2A agent/endpoint, task lifecycle, streaming, SDK/TCK integration.
- Real IDE activation verification.
- Full JSON Schema validation (Ajv), public-key signatures, OAuth flows, DNS-aware SSRF defence, sandbox runner, dashboard, SARIF, OpenTelemetry.

No certification of any kind is claimed.
