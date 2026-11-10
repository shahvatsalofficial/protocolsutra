# Architecture: ProtocolSutra AI

## C0 — Mission and trust boundaries

Local developer input -> validation / replay / evidence analysis -> standardized artifacts. Agent IDE is an optional *interface* and server hosting is an optional *execution environment*. User-approved inputs are untrusted data; they cannot issue commands.

## C1 — Containers

- Offline Node.js CLI: accept JSON inputs, coordinate workflows, emit reports.
- Deterministic core: version-scoped structural profiles, recorded JSON-RPC replay, basic policy checks, imported-evidence matrix.
- Local report server: authenticated loopback-only read path; not MCP/A2A.
- Skills and IDE adapters: reusable instructions with project-local installation; host-specific execution unverified.
- Future runner: isolated subprocess/container invoking official MCP/A2A SDKs and safe endpoints.
- Future dashboard/observability: read-only report viewer with optional tracing.

## C2 — Components

`packages/core/validate.mjs` — MCP snapshot and A2A card structural checks.
`packages/core/replay.mjs` — imported JSON-RPC response expectation checks and permission model.
`packages/core/matrix.mjs` — imported evidence summary (reported, not certified).
`packages/core/report.mjs` — JSON/Markdown/HTML.
`packages/core/installer.mjs` — controlled project-local skill copy.
`packages/server/index.mjs` — token-protected report API.

## C3 — Interfaces and data contracts

ProtocolSutra-specific fixture kinds: `mcp-snapshot`, `a2a-agent-card`, `protocolsutra-replay-suite`, `protocolsutra-matrix-evidence`. These are not normative protocol wire formats. Reports include schemaVersion, protocol version/known limitations and source digest. Observed outcomes: PASS/NO_GO/INCONCLUSIVE. Reference state: reported-pass/untested.

## C4 — Implementation and extension discipline

Use protocol adapter interfaces to isolate spec revisions, transport implementation, auth, tool discovery and workflow execution. Each adapter must document permissions and test matrix. Full JSON Schema compliance needs a proven validator; current subset is not full schema validation. Avoid wildcard network targeting or private IDE credential reuse.

## Deployment

Standalone CLI works offline. Optional server deployment requires reverse proxy, TLS, per-tenant authentication, authorization, rate limits, ephemeral sandbox workers, audit logs, secret vault and independent security review; none is implemented in starter.
