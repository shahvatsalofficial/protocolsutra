# ProtocolSutra AI — Development Rules (all agents)

- Creator: Vatsal Shah. Product: ProtocolSutra AI. Scope: safe interoperability engineering.
- Read `docs/STATUS.md` first; this repository is a starter, **not** a complete standards conformance suite.
- MCP spec baseline: 2026-07-28. A2A stable baseline: 1.0.0. ProtocolSutra snapshot/replay JSON are **application fixture formats**, not native wire protocol messages.
- Use only maintained official SDKs for future live integrations. Do not silently call arbitrary remote endpoints, extract credentials or execute third-party tools.
- Only claim supported IDE/OS combinations with recorded tests. The canonical SKILL.md format is portable but execution depends on host features.
- Offline deterministic core works without API keys; optional local/hosted AI requires documented permission and explicit configuration.
- Every changed feature needs tests and updated examples; record `PASS` / `NO_GO` / `INCONCLUSIVE` without suppressing missing evidence.
- Never overwrite user files, publish repositories, run costly services, install globally or make production changes without permission.
- Prefer project-local configuration and provide safe rollback steps.
