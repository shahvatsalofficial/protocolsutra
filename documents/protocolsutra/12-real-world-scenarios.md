# Real-world scenarios

Six situations where evidence matters, each with the real command and the real findings. The findings come from this repository's fixtures; the terminal views are condensed from the generated report tables (the CLI itself prints JSON, Markdown or HTML). Run the same commands and you will see the same rule ids, paths and exit codes.

> The fixtures live in `fixtures/`. Replace them with your own snapshots; the commands do not change.

## A pull request breaks a tool

**Situation.** A teammate "tidies" the `search` tool: `limit` becomes a string, a new `scope` input becomes required and the old `legacy` tool is removed. Every agent that calls them will start failing, but the code review only shows a schema diff that looks harmless.

{{flow:ci}}

**What you do.** Capture `tools/list` from `main` and from the pull request, then compare.

```bash
npx protocolsutra diff --before main-snapshot.json --after pr-snapshot.json --format all --out reports/diff
```

**What you see.**

```terminal
$ npx protocolsutra diff --before v1.json --after v2.json
NO_GO  contract diff · 5 findings
ERROR  TOOL_REMOVED                     tools.legacy
ERROR  CONTRACT_PROPERTY_TYPE_CHANGED   tools.search.inputSchema.properties.limit.type
ERROR  CONTRACT_REQUIRED_ADDED          tools.search.inputSchema.properties.scope
INFO   DESCRIPTION_CHANGED              tools.search.description
INFO   TOOL_ADDED                       tools.export
$ echo $?
2
```

| Finding | Why it matters |
|---|---|
| `TOOL_REMOVED` | Callers of `legacy` get "unknown tool" |
| `CONTRACT_PROPERTY_TYPE_CHANGED` | `limit` was an integer, callers still send integers |
| `CONTRACT_REQUIRED_ADDED` | Old calls omit `scope`, so every old call is now invalid |
| `DESCRIPTION_CHANGED` | Info only, but re-run `audit`: a changed description is how a rug-pull happens |

**Wire it into CI** so the merge is blocked automatically:

```yaml
- run: npx protocolsutra@latest diff --before main-snapshot.json --after pr-snapshot.json --format all --out reports/diff
- uses: actions/upload-artifact@v7
  if: always()
  with: { name: protocolsutra-reports, path: reports/ }
```

Exit code `2` fails the job. The HTML report is attached to the run for the reviewer.

## Vetting a third-party MCP server

**Situation.** You want to connect a community MCP server. Its tool descriptions are text that your model will read as trusted context. One of them hides an instruction.

{{flow:trust}}

**What you do.** Save the server's `tools/list` output and audit it before connecting.

```bash
npx protocolsutra audit --input third-party.json --format all --out reports/audit --strict
```

**What you see** (from `fixtures/audit/poisoned.json`):

```terminal
$ npx protocolsutra audit --input poisoned.json
NO_GO  security audit · 12 findings (6 errors)
ERROR    TP_CONCEAL               tools[0].description
ERROR    TP_EXFIL_DIRECTIVE       tools[0].description
ERROR    TP_HIDDEN_DIRECTIVE      tools[0].description
ERROR    TP_IGNORE_INSTRUCTIONS   tools[0].description
ERROR    TP_SECRET_ACCESS         tools[0].description
WARNING  ANNOTATION_NAME_CONFLICT tools[1].annotations
WARNING  TOOL_HIGH_IMPACT_NAME    tools[1].name
ERROR    TP_HIDDEN_UNICODE        tools[2].description
```

Reading the result:

- `tools[0]` is a "weather" tool whose description tells the model to read `~/.ssh/id_rsa`, send it to a URL and not tell the user. Five separate rules fire.
- `tools[1]` is `run_shell` claiming `readOnlyHint: true`. Annotations are self-reported, so the audit flags the contradiction. Never use them as permission.
- `tools[2]` hides text with a zero-width character that a human reviewer cannot see.

> A clean audit is **not** proof of safety. The detector is regex-based and misses paraphrase, other languages and encodings. Treat it as a fast first filter in front of a human review. See [Evidence and method](07-evidence-and-methodology.md) for the published misses.

## An agent tries to escape its workspace

**Situation.** An agent is allowed to call `read_file` inside `/workspace`. A prompt injection makes it try `../../etc/passwd`, and then a cloud-metadata URL to steal instance credentials.

{{checks:policy}}

**What you do.** Evaluate each call against a policy before it executes.

```json
{ "kind": "protocolsutra-policy", "allowedTools": ["read_file", "echo"], "deniedTools": ["delete_file"], "allowedHosts": ["api.example.com"], "pathRoots": ["/workspace"] }
```

```terminal
$ npx protocolsutra policy --policy policy.json --call traversal.json
DENY   gate NO_GO
reasons: PATH_OUTSIDE_ROOTS:path

$ npx protocolsutra policy --policy policy.json --call ssrf.json
DENY   gate NO_GO
reasons: URL_CLOUD_METADATA:url, URL_NOT_HTTPS:url, URL_HOST_NOT_ALLOWLISTED:url

$ npx protocolsutra policy --policy policy.json --call allowed.json
ALLOW  gate PASS
```

Three details worth knowing:

1. **Deny by default.** An empty allowlist allows nothing, and `deniedTools` always wins.
2. **Annotations are ignored.** A tool cannot talk its way past the policy by calling itself read-only.
3. **Static URL checks only.** `policy` does not resolve DNS, so a real runtime must also re-check the resolved IP address (DNS rebinding).

**Replaying what happened.** If you have a recorded trace where a disallowed tool *succeeded*, `replay` turns that into a release blocker:

```terminal
$ npx protocolsutra replay --input failing.json
NO_GO  replay · 2 cases
FAIL          permission-bypass   OUTCOME_MISMATCH, PERMISSION_BYPASS
INCONCLUSIVE  not-run             NO_OBSERVATION
```

Note the second case: a request with **no recorded response** is `INCONCLUSIVE`, never a pass.

## A release gate that cannot be averaged away

**Situation.** Your release checklist has five checks. Four are green. One found a permission bypass. A dashboard that shows "80 % passing" lets it ship.

{{ladder}}

**What you do.** Feed every report into one gate. The worst result decides.

```terminal
$ npx protocolsutra gate --report validate.json --report replay.json --strict
NO_GO  release gate
validate.json   NO_GO  offline-structural-profile
replay.json     PASS   offline-recorded-replay
blockers: validate.json
$ echo $?
2
```

Rules the gate follows:

| Situation | Result |
|---|---|
| Any input is `NO_GO` | `NO_GO` |
| Any input is `INCONCLUSIVE`, none `NO_GO` | `INCONCLUSIVE` |
| Only warnings | `REVIEW` (or `GO` with `--allow-review`) |
| A report with no gate, or no reports at all | `INCONCLUSIVE`, never `GO` |
| Every report passes | `GO` |

Add `--strict` in CI so `REVIEW` and `INCONCLUSIVE` also fail the job (exit `3`).

## Handing proof to a security reviewer

**Situation.** A reviewer asks, "How do I know this report is the one your pipeline produced?" Emailing a PDF proves nothing.

{{flow:capsule}}

**What you do.** Seal the report, send the capsule, and let the reviewer verify it.

```bash
npx protocolsutra capsule export --input reports/audit.json --source "PR 42" --out capsule.json
npx protocolsutra capsule verify --input capsule.json
```

```terminal
$ npx protocolsutra capsule verify --input capsule.json
{ "valid": true, "gate": "PASS", "problems": [], "signature": "none" }
```

Now someone edits one number in the evidence:

```terminal
$ npx protocolsutra capsule verify --input edited-capsule.json
{ "valid": false, "gate": "NO_GO", "problems": ["DIGEST_MISMATCH"], "signature": "none" }
$ echo $?
2
```

To also prove *who* sealed it, set a shared key on both sides:

```bash
export PROTOCOLSUTRA_SIGNING_KEY="a-long-random-secret-of-16-chars-or-more"
```

> **What a capsule proves.** The file has not changed since export, and (with the key) that someone holding the key sealed it. It does **not** prove the underlying checks were run honestly, and HMAC is a shared-secret tag, not a public-key signature.

Secrets such as bearer tokens, cloud keys and private-key blocks are redacted at export, so a capsule is safer to attach to a ticket than a raw report.

## Reviewing a partner's A2A Agent Card

**Situation.** A partner sends the Agent Card for an agent you plan to call. You want a concrete list of problems to send back, not a vague feeling.

**What you do.**

```bash
npx protocolsutra validate --input partner-card.json --format all --out reports/card
```

```terminal
$ npx protocolsutra validate --input partner-card.json
NO_GO  structural validation · 6 findings
ERROR    A2A_NAME               name
ERROR    A2A_SKILL_NAME         skills[0].name
ERROR    A2A_DUPLICATE_SKILL    skills[1].id
ERROR    A2A_INTERFACE_BINDING  supportedInterfaces[0].protocolBinding
WARNING  A2A_DESCRIPTION        description
WARNING  A2A_INTERFACE_SCHEME   supportedInterfaces[0].url
```

Send the HTML report to the partner. Each row names the exact JSON path to fix.

Run `audit` on the same card to also catch missing security schemes and plaintext remote URLs.

> `validate` checks a ProtocolSutra structural profile based on selected A2A 1.0 elements. It does not test that the agent actually speaks the protocol. For that, use the official A2A tools and feed their results into your gate.

## Pick your next step

| You want to… | Read |
|---|---|
| Install and run in 60 seconds | [User guide](03-user-guide.md) |
| Know exactly what each command proves | [Functional guide](02-functional-guide.md) |
| Look up a rule id or exit code | [Technical reference](05-technical-reference.md) |
| Understand the limits honestly | [FAQ and limitations](10-faq-and-limitations.md) |
