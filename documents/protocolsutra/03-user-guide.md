# User Guide

## Requirements

Node.js 20 or newer. No other dependency, account, API key or network access.

## Install

```bash
npx protocolsutra --help          # run without installing
npm install --save-dev protocolsutra   # or add to a project
npm install -g protocolsutra      # or global
```

From source:

```bash
git clone https://github.com/shahvatsalofficial/protocolsutra.git
cd protocolsutra
npm test
```

## First run in 60 seconds

```bash
protocolsutra fixture create --kind mcp --out snapshot.json
protocolsutra validate --input snapshot.json
protocolsutra audit    --input snapshot.json --format all --out audit-report
```

Open `audit-report.html` in any browser. It works offline and contains no scripts.

## Capturing a snapshot

An `mcp-snapshot` is a JSON file you create from the output of your server's `tools/list` call:

```json
{
  "kind": "mcp-snapshot",
  "name": "my-server",
  "protocolVersion": "2026-07-28",
  "capabilities": { "tools": {} },
  "tools": [ { "name": "echo", "description": "Echo text", "inputSchema": { "type": "object", "properties": { "text": { "type": "string", "maxLength": 500 } }, "required": ["text"], "additionalProperties": false } } ]
}
```

Remove credentials before saving. ProtocolSutra redacts common secret formats but redaction is best-effort.

## Typical workflows

### Block breaking changes in CI

```bash
protocolsutra diff --before main-snapshot.json --after pr-snapshot.json --format all --out reports/diff
```

Exit code `2` means a breaking change was found.

### Audit a third-party server before trusting it

```bash
protocolsutra audit --input third-party.json --format all --out reports/audit --strict
```

### Release gate over several reports

```bash
protocolsutra validate --input snapshot.json --out reports/validate.json
protocolsutra audit    --input snapshot.json --out reports/audit.json
protocolsutra gate --report reports/validate.json --report reports/audit.json --format all --out reports/gate --strict
```

### Check a tool call against policy

```bash
protocolsutra fixture create --kind policy --out policy.json
protocolsutra policy --policy policy.json --call call.json
```

### Share evidence

```bash
protocolsutra capsule export --input reports/audit.json --source "PR 42" --out capsule.json
protocolsutra capsule verify --input capsule.json
```

## GitHub Actions example

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx protocolsutra@latest audit --input snapshot.json --format all --out reports/audit --strict
- uses: actions/upload-artifact@v4
  if: always()
  with: { name: protocolsutra-reports, path: reports/ }
```

## Reading a report

| Result | Meaning | Exit code |
|---|---|---|
| `PASS` / `GO` | Nothing blocking within the stated scope | 0 |
| `REVIEW` | Warnings need a human decision | 0 (3 with `--strict`) |
| `INCONCLUSIVE` | Evidence missing; no pass can be claimed | 0 (3 with `--strict`) |
| `NO_GO` / `DENY` | Blocking failure | 2 |
| usage or runtime error | Bad arguments, unreadable or malformed JSON | 1 |

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Missing value for --input` | An option needs a value. |
| `--format all requires --out <basename>` | Provide a base name, not a directory. |
| Exit code 1 with a JSON parse message | The input file is not valid JSON. |
| `KIND_UNKNOWN` | The `kind` field must be `mcp-snapshot` or `a2a-agent-card`. |
| Symlink refusal in `install-skills` | The target path passes through a symlink; choose a real directory. |
