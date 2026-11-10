# Plugins, Tools and Skills Catalog

| Integration | Phase | Role | Requirement / boundary |
|---|---|---|---|
| Official MCP TypeScript SDK v2 (`@modelcontextprotocol/client`, `@modelcontextprotocol/server`) | P1 | Live local MCP client and fixture server | Pin compatible SDK version, use official 2026-07-28 spec |
| MCP Inspector v2 | P1 | Reference testing via CLI/TUI/web | Optional developer tool; never run against unknown remote servers silently |
| Official A2A JavaScript/TypeScript SDK | P2 | Agent Card, tasks, streaming | Target A2A 1.0.0; binding-specific cases |
| Official A2A Inspector and TCK | P2 | Compatibility tests | Keep emitted evidence and versions |
| Ajv | P1 | Full JSON Schema checks | Distinguish from current narrow structural rules |
| JSON Schema Test Suite | P2 | Validator correctness | Track drafts used |
| OpenTelemetry | P3 | Traces | Opt-in, redact sensitive payloads |
| Docker or isolated workers | P1 | Safe real process execution | User approval; no host-root, filesystem/network restrictions |
| fast-check | P2 | Property-based parsers/tests | Generate bounded adversarial fixtures |
| Gitleaks | P1 | Secret scanning | Local CI and pre-release |
| OSV-Scanner | P1 | Dependency safety | CI; version-pinned |
| GitHub Actions | P0 | Cross-OS CI | Config included, but actual remote CI not run here |
| Claude Code / Cursor / Codex / Gemini CLI / GitHub Copilot | P1–P3 | IDE interoperability | Capability adapters, independently tested |
| Local Ollama | Later | Optional AI explanations | Never mandatory, no remote API by default |
| Hosted Anthropic / OpenAI / Google models | Later | Optional reasoning | Explicit API credentials and billing consent |

## Installation policy

1. Run an inventory of already available tools and versions.
2. Compare the exact requested feature against the functionality in the existing project.
3. Verify official documentation, package license, maintenance, supported Node version and required permissions.
4. Prefer project-local installation and reproducible lockfiles.
5. Ask the user before global installation, remote access, code execution, expensive services or sending data to external providers.
6. Keep deterministic offline mode independently testable and maintain a mock adapter fallback.

Official resources:
- MCP 2026-07-28: https://modelcontextprotocol.io/specification/2026-07-28
- MCP TypeScript SDK v2: https://ts.sdk.modelcontextprotocol.io/v2/
- MCP Inspector: https://github.com/modelcontextprotocol/inspector
- A2A 1.0: https://a2a-protocol.org/v1.0.0/specification/
- A2A official project: https://github.com/a2aproject/A2A
- Agent Skills: https://agentskills.io/specification
