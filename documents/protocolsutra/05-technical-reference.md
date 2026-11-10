# Technical Reference

## Command synopsis

```text
protocolsutra validate   --input <snapshot.json>
protocolsutra audit      --input <snapshot.json>
protocolsutra diff       --before <old.json> --after <new.json>
protocolsutra replay     --input <suite.json>
protocolsutra matrix     --input <evidence.json>
protocolsutra policy     --policy <policy.json> --call <call.json>
protocolsutra regression --before <report.json> --after <report.json>
protocolsutra gate       --report <a.json> [--report <b.json> ...] [--allow-review]
protocolsutra capsule export --input <report.json> [--source <label>] [--out <file>]
protocolsutra capsule verify --input <capsule.json>
protocolsutra fixture create --kind mcp|a2a|replay|policy|matrix [--name <n>] [--out <file>]
protocolsutra install-skills --host claude|cursor|codex|gemini|copilot|generic --target <dir> [--force]
protocolsutra serve --report <report.json> [--port 8765]
protocolsutra doctor | --version | --help
```

Common options: `--format json|md|html|all`, `--out <path>`, `--strict`.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Completed; gate `PASS`/`GO`, or `REVIEW`/`INCONCLUSIVE` without `--strict` |
| 1 | Usage or runtime error (bad option, unreadable or malformed JSON) |
| 2 | Gate `NO_GO` or policy `DENY`; capsule verification failed |
| 3 | `REVIEW` or `INCONCLUSIVE` with `--strict` |

## Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `PROTOCOLSUTRA_TOKEN` | `serve` | Bearer token, at least 16 characters |
| `PROTOCOLSUTRA_SIGNING_KEY` | `capsule export/verify` | At least 16 characters; enables HMAC-SHA256 |

## Programmatic API

```js
import { validateSnapshot, auditSecurity, diffSnapshots, evaluatePolicy, releaseGate, exportCapsule, verifyCapsule, htmlReport } from 'protocolsutra';

const report = auditSecurity(snapshot);
const html = htmlReport(report);
```

All functions are synchronous, pure and throw only on malformed *arguments*; untrusted *content* produces findings, not exceptions.

## Common report fields

| Field | Meaning |
|---|---|
| `schemaVersion` | Report shape version |
| `evaluation` / `mode` | Which evaluator produced it |
| `findings[]` | `{ id, rule, level, path, message, evidenceClass? }` |
| `totals` | Counts by level, or `PASS/FAIL/INCONCLUSIVE` for replay |
| `gate` | `PASS`, `REVIEW`, `INCONCLUSIVE`, `NO_GO` (policy: `DENY`) |
| `inputDigest` | SHA-256 of the canonical input |
| `notice` | The scope statement every reader should see |

## Rule catalog

### Structural (`validate`)

| Rule | Level | Meaning |
|---|---|---|
| `MCP_VERSION_MISSING` | error | `protocolVersion` absent |
| `MCP_VERSION_UNTESTED` | warning | No local profile for that version |
| `MCP_NAME`, `MCP_TOOLS` | error | Server name or tools array missing |
| `MCP_TOOL_DUPLICATE` | error | Two tools share a name |
| `MCP_TOOL_NAME`, `MCP_TOOL_OBJECT` | error | Tool entry malformed |
| `SCHEMA_ROOT_TYPE` | error | Input schema root is not `type: object` |
| `SCHEMA_UNDECLARED_REQUIRED` | warning | Required field has no declared property |
| `MCP_OUTPUT_SCHEMA` | error | `outputSchema` is not an object |
| `MCP_ANNOTATION_UNTRUSTED` | info | `readOnlyHint` is advisory only |
| `MCP_SECRET_IN_SNAPSHOT` | error | Credential material in the snapshot |
| `A2A_INTERFACES` | error | No `supportedInterfaces` |
| `A2A_INTERFACE_URL`, `A2A_INTERFACE_BINDING` | error | Interface lacks URL or binding |
| `A2A_DUPLICATE_SKILL`, `A2A_SKILL_ID`, `A2A_SKILL_NAME` | error | Skill entry problems |
| `A2A_VERSION_UNKNOWN`, `A2A_VERSION_UNTESTED` | warning | Version not explicit or not profiled |

### Security audit (`audit`, all heuristic)

| Rule | Level | Detects |
|---|---|---|
| `TP_IGNORE_INSTRUCTIONS` | error | "ignore previous instructions" style overrides |
| `TP_HIDDEN_DIRECTIVE` | error | `<important>`, `<system>` pseudo-tags |
| `TP_EXFIL_DIRECTIVE` | error | Instructions to send data elsewhere |
| `TP_SECRET_ACCESS` | error | Steering toward `~/.ssh`, `.env`, `/etc/passwd` |
| `TP_CONCEAL` | error | Asking to hide behaviour from the user |
| `TP_HIDDEN_UNICODE` | error | Zero-width and bidi control characters |
| `TP_OVERSIZED_TEXT` | warning | Text over 4000 characters |
| `SECRET_IN_TEXT` | error | Credential-like strings |
| `TOOL_HIGH_IMPACT_NAME` | warning/info | `exec`, `shell`, `delete`, … |
| `ANNOTATION_NAME_CONFLICT` | warning | `readOnlyHint` on a high-impact name |
| `SCHEMA_UNBOUNDED_STRING` | warning | Unconstrained path/command/url string |
| `SCHEMA_ADDITIONAL_PROPERTIES` | info | `additionalProperties` not `false` |
| `AUTH_NOT_DOCUMENTED` | info | No authorization notes |
| `A2A_NO_SECURITY_SCHEMES`, `A2A_PLAINTEXT_INTERFACE` | warning/error | Card security gaps |

### Contract diff (`diff`)

`TOOL_REMOVED`, `TOOL_ADDED`, `CONTRACT_PROPERTY_REMOVED`, `CONTRACT_PROPERTY_ADDED`, `CONTRACT_PROPERTY_TYPE_CHANGED`, `CONTRACT_REQUIRED_ADDED`, `CONTRACT_REQUIRED_RELAXED`, `CONTRACT_ENUM_NARROWED`, `CONTRACT_ENUM_ADDED`, `CONTRACT_OUTPUT_SCHEMA_REMOVED`, `ANNOTATION_READONLY_DROPPED`, `DESCRIPTION_CHANGED`, `VERSION_CHANGED`.

### Replay (`replay`)

`RPC_REQUEST_INVALID`, `RPC_RESPONSE_INVALID`, `RPC_ERROR_INVALID`, `CASE_DUPLICATE`, `EXPECTATION_MISSING`, `NO_OBSERVATION`, `OUTCOME_MISMATCH`, `PERMISSION_BYPASS`, `DENIAL_CONTEXT_MISSING`, `RESULT_MISMATCH`, `ERROR_CODE_MISMATCH`.

### Policy reason codes

`TOOL_EXPLICITLY_DENIED`, `TOOL_NOT_ALLOWLISTED`, `ARGUMENTS_TOO_LARGE`, `PATH_TRAVERSAL:<arg>`, `PATH_OUTSIDE_ROOTS:<arg>`, `PATH_NUL_BYTE:<arg>`, and URL codes: `URL_INVALID`, `URL_SCHEME_FORBIDDEN`, `URL_CREDENTIALS_EMBEDDED`, `URL_CLOUD_METADATA`, `URL_LOOPBACK_FORBIDDEN`, `URL_PRIVATE_ADDRESS`, `URL_INTERNAL_SUFFIX`, `URL_NOT_HTTPS`, `URL_HOST_NOT_ALLOWLISTED` (each suffixed with `:<arg>`).

## Capsule format

```json
{
  "capsuleVersion": "1",
  "kind": "protocolsutra-capsule",
  "source": "PR 42",
  "redacted": true,
  "executedLive": false,
  "evidence": { "...": "the redacted report" },
  "integrity": { "algorithm": "sha256", "contentDigest": "…", "hmacSha256": "… (optional)" }
}
```

`contentDigest` is the SHA-256 of the canonical JSON of everything except `integrity`.

## Limits

500 tools per snapshot, 500 replay cases, 1000 matrix entries, 200 gate inputs, 25 000 characters per string, depth 18, 1000 array items per array during sanitisation.
