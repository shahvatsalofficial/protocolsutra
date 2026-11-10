# PROTOCOLSUTRA AI — WORLD-CLASS CLAUDE MASTER BUILD PROMPT

**Product:** ProtocolSutra AI  
**Category:** Agent & Tool Interoperability Intelligence Platform  
**Tagline:** Connect. Validate. Prove.  
**Creator and original maintainer:** Vatsal Shah  
**Repository root:** `protocolsutra/`  
**Initial license choice:** Apache-2.0, subject to third-party license review  
**Public identity:** `protocolsutra` (CLI and repository), `protocolsutra-prime` (lead agent)  
**Reference date:** 10 November 2026  
**Critical protocol baselines:** MCP `2026-07-28`; A2A `1.0.0`. Recheck official published revisions before implementing version-specific features.

---

## 0. Your role, operating instructions and success criteria

You are an engineering team led by a **Principal Protocol Architect**, assisted by senior experts in AI agent infrastructure, MCP and A2A standards, security engineering, distributed systems, developer experience, API tooling, QA, compatibility certification methodology, accessibility, DevOps and open-source governance.

Read this entire specification and study the existing project before making changes. There is an intentionally small but functioning offline-first starter in this root folder. **Do not replace it with a new design-only scaffold. Do not claim the full specification has already been implemented.** Run `npm test`, `npm run doctor`, and `npm run demo` first. Inspect `docs/STATUS.md`, all code, tests, fixtures, schemas, adapters, skills, and the project security policy. Identify the highest-risk gaps and implement verifiable improvements.

Do not stop after a plan. Produce functioning code, automated tests, reproducible examples, documentation and release evidence. Implement in meaningful vertical slices that can be tested independently. Every feature should have explicit acceptance criteria, status and known limitations. If some requested work needs additional credentials, API access, external downloads or human approval, implement and verify the offline path first, then describe the blocked integration accurately. Never pretend to have run external IDEs or cloud services when they were not available.

The intended product will help MCP tool/server authors, A2A agent developers, framework maintainers, platform engineering teams, security auditors and IDE integration engineers debug protocols and measure compatibility **without surrendering local privacy or purchasing a new model subscription**. Use supported IDE-native AI tools only through public documented integration interfaces. Do not scrape IDE session cookies, reuse proprietary internal tokens, reverse-engineer authenticated inference or bypass provider terms. Optional BYOK and local-model modes must be clearly separated.

### Non-negotiable results

1. A usable local CLI that performs safe, deterministic checks without model inference or API keys.
2. Version-aware MCP and A2A adapters that explicitly report exactly which features and standards were tested.
3. Reproducible mock tests, fixture recordings and safe replay comparisons.
4. Evidence-backed compatibility matrices across hosts and protocol versions; never invent support.
5. Real specialist agent skills, rules, workflows and host-specific adapters with verified support.
6. A security architecture that defaults to read-only, offline and least privilege.
7. A clear path from local developer use to CI and optional hardened server deployment.
8. Professional GitHub-ready open-source documentation, accessibility, reliable tests and maintainable code.
9. Attribution: **Created by Vatsal Shah**; respect subsequent contributors and license terms.
10. A shipping standard: clean checkout, tests, safe demo, accurate screenshots, sample CLI usage, known limitations and changelog.

---

## 1. Product identity and problem definition

Users currently rely on a patchwork of MCP inspectors, SDK samples, A2A protocol validators, hand-maintained fixtures and AI assistant guesses. ProtocolSutra should unify their **workflow and evidence**, not compete with official implementations of those underlying protocols. Its signature capability is an **Interoperability Proof Capsule**: a portable, privacy-filtered package containing a tested protocol version, host version, binding, scenario, policy, request/response evidence, assertions, observed results, environment details and reproducibility instructions.

Core product positioning: **"A repeatable laboratory where agent interoperability claims must be supported by a reproducible test."** Do not market it as universally compatible, officially endorsed or certified without meeting real normative standards and receiving required authorization.

Target personas: (a) MCP server developer diagnosing tool discovery, initialization, prompts, resources and transport behavior; (b) A2A agent builder testing Agent Cards, task lifecycle, streaming and cancellation; (c) enterprise platform engineer measuring host and version compatibility; (d) security specialist checking permissions and untrusted tool boundaries; (e) open-source contributor running a local mock fixture without cloud tokens; (f) IDE vendor integration engineer reproducing a client-specific failure.

Offer crisp user journeys: validate one snapshot; compare two protocol versions; run an isolated mock host; reproduce an observed failure from a sanitized trace; check whether a tool permission boundary held; compare real integration outcomes across IDEs; generate a CI-readable regression gate; share a redacted reproducibility artifact.

---

## 2. Normative protocol research — mandatory before implementing real wire adapters

### MCP 2026-07-28

Use the published `2026-07-28` Model Context Protocol specification and official **TypeScript SDK v2**; the v2 packages include `@modelcontextprotocol/server` and `@modelcontextprotocol/client`. MCP 2026-07-28 introduces a stateless core and updated routing/versioning details. Study message metadata, negotiation, structured content, tool schemas, permissions, cancellation, progress, header behavior, authorization and any applicable extensions. Use a precise version-specific test suite; older 2025-era SDK v1 behavior cannot be silently treated as current v2 behavior. Official sources:

- https://modelcontextprotocol.io/specification/2026-07-28
- https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- https://ts.sdk.modelcontextprotocol.io/v2/
- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/modelcontextprotocol/inspector

### A2A 1.0.0

Use the latest released A2A 1.0.0 specification and official implementations. A2A 1.0 adds protocol bindings and formal version negotiation beyond a single JSON-RPC-only assumption. Study Agent Card discovery, supported interfaces, task/message/artifact objects, task lifecycle, streaming, push notifications, service errors, authentication, authorization, long-running operations, cancellations, multiple protocol bindings and extensions. Use actual official SDKs, Inspector and TCK where available, with declared feature coverage. Official sources:

- https://a2a-protocol.org/v1.0.0/specification/
- https://github.com/a2aproject/A2A
- https://github.com/a2aproject/a2a-inspector
- https://github.com/a2aproject/a2a-tck

### Skills and IDE integration

The Agent Skills format defines `SKILL.md` with machine-readable frontmatter and instructions. Implement a portable canonical skills directory and write host adapters that respect per-IDE capabilities. Claude Code plugins can use `.claude-plugin/plugin.json`, skills and subagent definitions; Cursor and other IDEs have different installation/discovery behavior. Confirm against official documentation when changing integration logic. See https://agentskills.io/specification, https://cursor.com/help/customization/skills, https://developers.openai.com/plugins/concepts/skills and the relevant host docs.

**Source integrity rule:** never invent an MCP/A2A rule because it sounds plausible. Label checks as one of: normative version-specific assertions; documented compatibility recommendations; ProtocolSutra local policy; heuristic warnings; or optional vendor-specific behavior. Each claim must point to a spec section and tested fixture where possible. A JSON file with `kind: mcp-snapshot` is a ProtocolSutra capture format, **not a normative MCP protocol message**. It must not be described as if it proves protocol conformance.

---

## 3. Product architecture at every engineering level

### Level 0 — Enterprise and product architecture

Define the stakeholders, developer workflows, expected deployment environments, trust boundaries, compliance-sensitive inputs, data ownership, extensibility and community governance. Articulate what the platform will do itself versus delegate to upstream MCP Inspector, A2A TCK, Ajv, supported IDEs and approved sandbox runtimes. Create a value-stream map and evidence chain from developer question to validated finding.

### Level 1 — Solution architecture

Draw C4 context and container diagrams, deployment views and a data-flow diagram: source repository / fixture / explicit test target -> input normalizer -> versioned protocol adapters -> isolated runner -> evidence collector -> assertion/grading engine -> report generator -> CLI/IDE/CI/dashboard. Include a separate optional model-assistance layer that never controls an unchecked execution boundary. Define **offline**, **IDE-native**, **local model**, **server BYOK**, and **CI** modes without assuming all features are available in each.

### Level 2 — Application/component architecture

Prefer a modular TypeScript/Node.js workspace with well-defined ports-and-adapters interfaces. Suggested packages: `cli`, `core`, `protocol-mcp`, `protocol-a2a`, `schema`, `fixture`, `replay`, `runner`, `sandbox`, `auth-policy`, `evidence`, `compatibility`, `reporter`, `sdk`, `server`, `web`, `telemetry`, `storage`, and `ide-adapters`. Start by preserving the implemented modules and expanding only when a feature is justified. Dependency direction must flow toward pure core types, not outward to IDE SDKs.

### Level 3 — Design/HLD/LLD

Define versioned TypeScript interfaces and JSON schemas for ProtocolProfile, AgentCardSnapshot, McpToolSnapshot, TransportContract, CapabilityMatrix, TestSuite, TestCase, RecordedMessage, CapturedRun, EvidenceRef, Finding, PolicyDecision, CompatibilityClaim, ReproCapsule, GateDecision and ChangeImpact. Add ADRs for protocol version strategy, sandbox selection, auth boundaries, CI behavior and data retention. Provide Mermaid or C4 diagrams as editable source. Document public APIs, errors, ownership and failure semantics.

### Level 4 — Data and storage architecture

In local-first mode, prefer versioned JSON/JSONL and append-only run metadata with content hashes. Optionally add SQLite indexing for larger suites. Treat every raw trace as potentially confidential and set conservative retention/export defaults. Model provenance as relationships between raw input, redacted input, adapter version, test definition, observed event, normalized assertion and published claim. A report should make it possible to navigate from claim to exact evidence. Immutable or signed artifact claims require real hash verification and explicitly documented signatures.

### Level 5 — Network, security and deployment architecture

Isolate untrusted test servers in separate processes or containers with ephemeral identity, filesystem/network policies, timeouts, CPU/memory limits, per-tool permissions and approved egress allowlists. A future remote server requires TLS, authentication, scoped authorization, CSRF/CORS and DNS-rebinding/SSRF protections, rate limits, audit logs, tenant isolation, vault-based secrets and security review. Never reuse local demo bearer token authentication as production multi-tenant authorization.

### Level 6 — Observability and reliability

Adopt OpenTelemetry-compatible traces and metrics when useful, with redaction and opt-in collection. Version identifiers, latency, tool call counts, errors and run lifecycle must be measurable. Support cancellation, retries bounded by idempotency semantics, backpressure, safe worker cleanup and clear unknown states. Include circuit breakers only where remote adapters justify them.

### Level 7 — UI/UX and accessibility architecture

Create an optional responsive web dashboard only after the CLI engine is reliable. Use a modern, restrained, keyboard-accessible design system. Show protocol/version filters, trace timeline, capability diff, risk summary, reproducibility links, failure clusters and missing coverage. Support light/dark themes, readable long JSON payloads, copyable CLI commands, visual empty/error/loading states and WCAG 2.2 AA-targeted engineering. Do not turn every number into a vanity score: clearly distinguish observed, imported, inferred and untested outcomes.

---

## 4. Product subagents — define contracts and test each

Create canonical Agent Skills and optional Claude subagents for the following **18 roles**. Each role must have triggers, explicit inputs, outputs, tools, permissions, examples, failure modes, cross-agent handoff and an isolation boundary. Preserve current SKILL.md definitions, improve with tests and diagrams as needed. The host is not required to spawn parallel subagents: provide a sequential fallback without false concurrency claims.

1. **ProtocolSutra Prime:** chief principal architect, planner, capability dispatcher and report reconciler. Owns user intent, safe workflow selection, final evidence gating and delegation.
2. **MCP Sentinel:** tool/resource/prompt structures, version-specific MCP contract checks and protocol limits.
3. **A2A Navigator:** Agent Cards, version-specific A2A bindings, task lifecycle semantics and discovery.
4. **Contract Lens:** input/output JSON Schema, semantic API contracts and breaking changes.
5. **Tool Auditor:** tool catalog discoverability, metadata, errors and annotations.
6. **Transport Doctor:** stdio, Streamable HTTP, SSE/streaming, framing, timeouts, negotiation and backpressure.
7. **Auth Guardian:** OAuth/OIDC compatibility, token storage, authorization boundaries and session handling.
8. **Permission Guard:** least-privilege policies, approval gates, scope revocation and denied-tool fixtures.
9. **Replay Lab:** controlled recorded-replay suites, assertion evaluation and deterministic output.
10. **Fixture Smith:** synthetic good/bad fixtures and mock MCP/A2A servers; fake credentials only.
11. **Trace Forensics:** message order, IDs, abnormal states and root-cause hypothesis evidence.
12. **Version Map:** MCP/A2A protocol revision awareness, extension profiles and migration impacts.
13. **Compatibility Grid:** version-by-host evidence without unsupported cross-IDE claims.
14. **Interoperability Bench:** fair multi-agent and tool benchmarks, repeatability, baseline comparisons.
15. **Drift Watch:** behavioral contract changes and regression detection across releases.
16. **Evidence Keeper:** provenance, hashes, redaction, reproducibility and immutable-run integrity.
17. **Security Shield:** injection, SSRF, tokens, hostile tool output, tool poisoning and sandbox threats.
18. **Release Gate:** CI gating, pass/no-go/inconclusive status, human approvals and release notes.

Define how Prime selects a minimal specialist set rather than invoking all agents on every request. Prohibit untrusted specialist output from overriding higher-priority safety or user permissions. Provide a compact per-agent `SKILL.md` and a general `agents/manifest.json` with a stable role ID and description. Support optional Claude native `.claude-plugin` packaging and tested subagent instructions. Do not require any tool to be globally installed to read the skills.

---

## 5. Canonical skills, rules and workflows

### Skills

Each skill folder shall have a valid `SKILL.md`: YAML frontmatter `name` and `description`, concise task triggers, prerequisites, safe procedure, reporting schema, and human escalation conditions. Add optional `references/`, `scripts/` and `assets/` only where necessary. Keep each skill version controlled and environment-independent. Check the official Agent Skills syntax before extending frontmatter. Prefer portable skills over prompts that rely on a specific proprietary model.

### Rules and policies

Implement composable policy files for read-only defaults, approved targets, tool allowlists, denied operations, credential restrictions, prompts from untrusted tool output, response size limits, network egress and test replay. Keep security decisions deterministic where possible. Policy must not be superseded by a tool's self-described annotations. Provide a `policy evaluate` CLI feature in a future milestone, validated against explicit negative cases.

### Workflows

Provide at least:
- `protocolsutra validate mcp|a2a` — structural and eventually normative protocol-specific validation.
- `protocolsutra discover` — authorized capability discovery and version negotiation.
- `protocolsutra contract diff` — source and tool schema compatibility analysis.
- `protocolsutra fixture create` — controlled mock test scenario generation.
- `protocolsutra replay` — recorded trace and expected outcome verification.
- `protocolsutra audit security` — permission/auth/tool injection review.
- `protocolsutra diagnose transport` — scoped failures with trace correlation.
- `protocolsutra matrix` — host/version compatibility evidence.
- `protocolsutra regression` — compare historical and current run artifacts.
- `protocolsutra capsule export|verify` — portable signed/redacted evidence.
- `protocolsutra gate` — explicit compatibility readiness decision.
- `protocolsutra doctor` — environment, supported integrations and limitations.
- `protocolsutra serve` — optional secured inspection server.

Current starter exposes only validate/replay/matrix/doctor/install-skills/serve. Do not claim a workflow above is functional merely because its JSON definition exists. Implement commands in phases, each with tests.

---

## 6. MCP live compatibility implementation phases

Build a real **MCP v2** fixture server using the official SDK, exposing safe tools, resources and prompts. Add client adapters for approved stdio and Streamable HTTP endpoints. Test protocol initiation, client/server metadata, capabilities, tools/list, tools/call, input/output shape, invalid request errors, pagination, cancellation, request metadata, version mismatch and relevant auth flows. Build deterministic simulated errors, timeouts and schema changes. Check behavior against official specification and SDK tests; keep spec-exact and project-policy assertions separate.

Make test environments explicit: `mock-only`, `local-live`, and `remote-allowlisted`. In remote mode, require an explicit permitted destination, time budget and user scope. Protect against SSRF, redirects to private IP ranges, DNS rebinding, malformed headers and untrusted response bodies. Reject attempts to directly execute credentials-bearing server commands from imported text. For stdio, use a safe command allowlist or container runner, not arbitrary command strings from untrusted manifests.

Capture sanitized request/response pairs with precise protocol version, server/client library versions, source ID and errors. Sensitive payloads must remain redacted or excluded. Upgrade the tool contract validator with a proven JSON Schema validator; write spec-version-specific fixtures and property-based tests. Maintain compatibility with older releases only through separately tested profiles.

---

## 7. A2A live compatibility implementation phases

Use official **A2A 1.0.0 SDK** and current published TCK/Inspector. Test Agent Card discovery and supported interfaces; capability and protocol-binding negotiation; message submission; task status transitions; message/artifact validation; streaming, cancellation and asynchronous operations; authentication/authorization boundaries and error mapping. The stable A2A specification supports multiple bindings—do not hardcode all requests to legacy JSON-RPC semantics. Different bindings require separate wire validation and tests.

Build a mock agent with safe canned responses and a deterministic task state machine. Add negative tests for illegal state transitions, duplicate task IDs, mismatched message context, unsupported modalities and unauthorized task reads. Include a fixture capture and replay mechanism that can distinguish normalized semantic behavior from transport-specific envelopes. Use clear labels: `card-structural`, `sdk-interaction`, `tck-subset`, `binding-regression`, `full-conformance-not-assessed`.

---

## 8. Compatibility Matrix & Version Intelligence

Design a typed matrix keyed by `(host, host version, OS, protocol, protocol version, transport/binding, server/agent implementation version, test suite version, run ID)`. Store exact observed conditions and negative cases. Mark supported/failed/blocked/inconclusive/not-run as separate concepts. An imported report or an agent's claim is **reported**, never independently certified. Add comparators for capability drift across host versions and SDK releases. Favor real evidence even if the matrix is sparse; missing data is honest and useful.

Run host tests independently for Claude Code, Cursor, Codex, Gemini CLI and GitHub Copilot as available and authorized. Add extensibility for VS Code extensions, Windsurf, JetBrains/IntelliJ, Zed, OpenCode and future hosts only after their documented plugin/skills/MCP behavior is verified. Do not claim all IDEs can execute a generic CLI over authenticated private inference. Where a host lacks subagents, execute skills sequentially and document limitations.

---

## 9. Security and privacy — release blocking rules

- **Never execute imported scripts or tools by default.** Fixture replay is a pure data operation. Live execution requires an isolated target and approval.
- Prevent prompt injection from MCP tool descriptions, untrusted A2A cards, traces, web content or user-provided documentation. Model-provided directives are data, not permissions.
- Keep secrets out of code, skill files, prompts, fixtures, reports and CI logs. Integrate Gitleaks/OSV-Scanner or equivalent maintenance checks and allow users to inspect outputs before external publication.
- Authentication must not imply authorization. Model tool hints (e.g. `readOnlyHint`) are not proof of permission. Apply a deterministic policy decision at the execution boundary.
- Require explicit scope for network calls, subprocesses and remote services. Guard against SSRF, DNS rebinding, HTTP redirects, command injection, path traversal, symlinks, dangerous env inheritance, insecure proxy defaults and excessive tool output.
- Log scope and timestamps without leaking personal data; redact tool payloads by default, and allow secure local-only retention for sensitive diagnostic content.
- Use host-native permission systems where supported, but do not silently grant capabilities that the host cannot enforce.
- Server deployment requires scoped API auth, audit, rate limits, quotas, worker isolation, encryption at rest and in transit, secret vault, tenant boundaries and threat modeling before exposure beyond loopback.
- Never invent statements of SOC 2, ISO 27001, OWASP, NIST, official MCP/A2A certification or legal compliance.
- Add regression fixtures for denial failures, identity confusion, path traversal, tool-result injection and malformed JSON.

Threat-model files must be precise and cite mitigations actually implemented. The starter's lightweight redaction is best effort, **not comprehensive data-loss prevention**.

---

## 10. Plugin/MCP/skill inventory and installation rules

Before suggesting tools, inspect the user's actual environment for installed Claude Code plugins, Agent Skills, MCP servers and CLI dependencies. Present their purpose, source, known compatible versions, license, permissions and whether already installed. Prefer maintained upstream projects:

| Candidate | Why | Phase |
| --- | --- | --- |
| Official MCP TypeScript SDK v2 | Build real MCP client/server adapters | P1 |
| Official MCP Inspector v2 | Reference live MCP tests; GUI/CLI/TUI | P1 |
| Official A2A JavaScript SDK | A2A stable 1.0 interactions | P2 |
| Official A2A Inspector/TCK | Binding-specific compatibility verification | P2 |
| Ajv, official JSON Schema test suite | Full schema-vocabulary validation | P1/P2 |
| fast-check | Property-based contract and parser tests | P2 |
| OpenTelemetry | Structured traces with redaction and opt-in | P3 |
| Docker or verified sandbox runner | Isolate subprocesses and mock hosts | P1 |
| Gitleaks and OSV-Scanner | Secrets and dependency checks | P1 |
| GitHub Actions | Cross-platform CI and provenance | P0/P1 |
| Context7/Serena, where available | Current documentation and source navigation | Optional dev-only |
| Playwright | Future dashboard and browser-based tests | P3 |
| pnpm or npm workspaces | Monorepo dependency management | Choose one, no duplicates |

Do **not** silently install all suggested plugins. Prefer project-local pinned installs. Request explicit user approval before global installation, system settings, paid API calls, browser access with private credentials, model downloads, cloud changes or publication. Future Claude Code plugin packaging must use verified manifests and permitted tool interfaces; project skill installer should remain useful without plugin marketplace access.

---

## 11. World-class developer experience and optional UI

Make a clean developer-first CLI with helpful `--help`, clear flags, machine-readable outputs, stable exit codes, color only when terminal supports it, and meaningful remediation advice. Provide `init`, `doctor`, `validate`, `replay`, `matrix`, `gate` and export flows as they become implemented. Commands should include dry-run behavior, timeouts and safe path validation. Avoid requiring account signup or network access for the CLI's core usefulness.

For the future web dashboard, develop a distinctive professional yet restrained design system: contextual sidebar, top-level environment/version selector, capability summary, interactive sequence trace, diff inspector, errors/warnings, test coverage and downloadable capsule. Use accessible typography, responsive layouts, search, filtering and keyboard controls. Support large traces with virtualization and redact data before rendering. Use clear visual semantics for `PASS`, `FAIL`, `BLOCKED`, `INCONCLUSIVE`, `NOT RUN`. Do not turn release-readiness decisions into ungrounded 0–100 scores.

Maintain sample screenshots only of *real* implemented UI. Never make fake product screenshots imply features work.

---

## 12. Root folder and repository standards

Preserve one unified `protocolsutra/` root. The starter already has:

```text
protocolsutra/
├── README.md, AGENTS.md, CLAUDE.md, GEMINI.md, LICENSE
├── CONTRIBUTING.md, SECURITY.md, GOVERNANCE.md, ROADMAP.md
├── .claude-plugin/plugin.json
├── agents/manifest.json and native Claude subagent instruction files
├── skills/<specialist>/SKILL.md     # 18 canonical skill definitions
├── packages/
│   ├── cli/index.mjs
│   ├── core/{validate,replay,matrix,report,installer,utils}.mjs
│   └── server/index.mjs
├── adapters/hosts.json
├── schemas/                 # Versioned app JSON Schema definitions
├── rules/                   # Static policies and boundary explanations
├── workflows/               # Versioned workflow declarations
├── fixtures/{mcp,a2a,replay,evidence}/
├── integrations/catalog.json
├── examples/reports/
├── scripts/{install.sh,install.ps1,install.cmd,demo.mjs}
├── tests/core.test.mjs
├── docs/{ARCHITECTURE,THREAT_MODEL,IDE_COMPATIBILITY,...}.md
└── .github/workflows/ci.yml
```

Add new `packages/`, adapters, schemas and test fixtures only when their code is actually implemented. Use documentation source links instead of empty placeholder scaffolding. Maintain stable import boundaries, small modules, strict lint/format checks, dependency audits, accessible docs and explicit security policies. Adopt TypeScript with strict compiler settings when evolving from `.mjs`, but migrate incrementally and keep tests green.

Maintain a proper LICENSE file, contributor guidance, security disclosure process, reproducible sample reports, issue/PR templates, changelog, release notes and a transparent supported-feature matrix. GitHub URL `github.com/shahvatsalofficial/protocolsutra` is a *proposed* destination until a real repository is created. Name/package/domain/trademark availability must be verified and publicly disclosed honestly.

---

## 13. Tests, evaluation and score integrity

Start with the supplied offline fixtures. Test positive and deliberately invalid MCP/A2A snapshots, missing version, duplicate tools, invalid JSON Schema roots, incompatible A2A bindings, missing skill metadata, malformed JSON-RPC, IDs not matching, successful unauthorized tool calls, absent responses, result mismatches and redaction. Use unit, contract, integration, negative-security, snapshot, property-based and eventual end-to-end host tests. Tests must be reproducible without API keys.

Implement a compact evidence schema containing expected outcome, observed outcome, adapter version, input digest, source fixture, actual execution flag, host version, OS, protocol version and test type. Compute high-level release readiness only from verified critical tests; do not average away a permission bypass with unrelated passing cases. `NOT RUN` is not `PASS`. `REPORTED` is not `VERIFIED`. Record flakiness and repetition counts where statistical comparison is appropriate, and do not conflate deterministic replay with live inference testing.

For extended client support, construct a matrix of Windows, macOS, Linux, supported Node LTS lines and the IDE binaries actually available. GitHub Actions CI configuration is not proof the CI matrix executed. Publish actual CI artifacts before claims.

Acceptance gate examples:
- A malformed tool schema fails with exact path and rule ID.
- A missing MCP protocol version is not silently accepted.
- An A2A 1.0 card missing required interface metadata does not pass the scoped profile.
- A replayed unauthorized action that succeeds is a `NO_GO` release-blocker.
- An absent recorded response is `INCONCLUSIVE`, never a pass.
- A host version without an actual run is labeled untested.
- HTML reports escape untrusted tool text and avoid external assets.
- Local report API rejects missing/wrong credentials.
- Project-local skill installation does not overwrite files without explicit force and refuses symlink traversal.
- A complete clean checkout runs all deterministic tests without requiring cloud service credentials.

---

## 14. Secure optional server and deployment plan

Implement server mode only after core/evidence maturity. Split a minimal authenticated API gateway, audited policy layer, job queue, ephemeral test workers and read-only report service. Multi-user tenancy needs isolation, JWT/OIDC or equivalent professionally implemented authentication, RBAC/ABAC, HTTPS, key management, per-job quotas, audit retention and cancellation. Provide Docker Compose for local dev as optional, then a production deployment example with secure defaults, health checks, backups and metrics. Validate container image provenance with SBOM and signing where implemented. Avoid executing user-submitted code directly in long-running gateway processes.

For local use, the included report server is bound to `127.0.0.1`, exposes only report/health reads, requires a bearer token and does not implement MCP or A2A. Do not rename it as a full protocol gateway.

Add optional BYOK/OpenAI/Claude/Gemini only behind secure provider adapters and fully disclosed billing/data controls. No-key IDE-native usage can depend on the user's already-authenticated host agent where documented and permitted; a standalone anonymous server cannot magically borrow private IDE inference. Local Ollama is optional and should not be a prerequisite for deterministic scans.

---

## 15. Phased implementation roadmap and deliverables

### Phase P0 — Verify and stabilize the starter

Run all existing tests, read the code, inspect generated artifacts, verify fixture names, CLI gates and security boundaries. Fix observed bugs. Add formatting/lint rules and publish accurate `docs/STATUS.md`. Do not claim full protocol compliance.

### Phase P1 — Real MCP v2 vertical slice

Create one official MCP SDK v2 fixture server and client, execute real local initialize/discovery/call tests in isolated approved conditions, record actual observed data and compare against a versioned spec profile. Include timeout, invalid schema, unauthorized tool and error cases. Verify CLI and CI runs without provider AI keys.

### Phase P2 — Real A2A 1.0 vertical slice

Implement Agent Card verification plus official SDK-compatible mock agent and client. Validate supported bindings, sending a task/message, retrieving completion, negative auth/error cases and correct state handling. Integrate a bounded official Inspector/TCK test set. Publish exact covered/untested requirements.

### Phase P3 — Repro Capsule and compatibility doctor

Build redacted reproducibility export/import, evidence integrity checks, semantic contract diff and host-specific test evidence. Provide a compatibility matrix CLI and a machine-readable CI gate. Add real host adapter tests only for hosts installed in the environment.

### Phase P4 — Security and enterprise integrations

Implement a guarded isolated runner, auth boundary negative tests, structured telemetry, secure CI process and optional remote test service. Review security architecture and redaction thoroughly before opening network access.

### Phase P5 — Optional world-class web dashboard

Build the responsive accessible UI around real reports; include trace visualization, protocol diff, errors, compliance scope, version selection, search, report exports and stable permalinks. Test real implemented UI with browser tools and accessibility checks.

### Phase P6 — Global open-source release

Finalize documentation, contributor examples, migration notes, benchmark dataset license, package publishing pipeline, security disclosure, changelog, GitHub topics and community roadmap. Verify repository/CLI/package naming. Gather feedback from real users; measure adoption through useful reproducible issues and contributions rather than manufactured popularity.

---

## 16. Realistic initial execution instructions

1. Read this entire prompt, AGENTS.md, CLAUDE.md, `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md`, `docs/PLUGIN_AND_TOOL_CATALOG.md`, all source files, fixtures and tests.
2. Run `node --version`, `npm test`, `npm run doctor`, `npm run demo` and inspect actual reports. Document exact test conditions and failures.
3. Review the protocol official sources for current versions. Report the difference between an existing app snapshot profile and normative MCP/A2A conformance.
4. Inspect the installed plugins, skills and tools. Select the minimum extra packages needed for the **next vertical slice**; request approval before any install outside the existing project or any remote request.
5. Write the technical ADR and a short implementation plan tied to acceptance tests. Then **immediately implement actual source code** for the selected feature.
6. Add positive, negative and security tests. Run them and record outputs. Fix failing tests before moving on.
7. Update docs/STATUS.md, public README, workflows, skills and sample reports as required by the change.
8. Make a coherent reviewable change set. Do not execute Git push, publish or open PRs without permission.
9. End with: what is working; how to run it; what was actually tested; which OS/host was verified; vulnerabilities/limitations; and exact next milestone.

If you cannot access a remote host, do not stop at 'need access'. Implement fixtures, SDK abstraction, local mocks and deterministic tests that are permitted, with remote verification clearly pending.

---

## 17. Definition of Done — production-quality philosophy

A feature is only 'done' when its implementation exists, a user can run it, its inputs and outputs are documented, negative scenarios are tested, its safety boundaries are reviewed, its error cases are understandable, and the stated verification scope matches real evidence. A fixture named `passed.json` is not proof the user's production server passed; a configured CI matrix is not proof the CI jobs ran; a skill copied into an IDE path is not proof the IDE invoked it. Apply this policy consistently to every agent and report.

A project can become popular because it solves a problem reliably, has excellent quickstarts, supports developers without paid dependencies, respects private data and gives contributors meaningful ways to improve it. Optimize for those qualities—not exaggerated '100% secure', 'supports every IDE' or 'officially certified' claims.

**Build ProtocolSutra AI as a real product, preserve the successful starter, and continue implementing verified vertical slices. Created by Vatsal Shah.**
