# Threat Model

| Asset | Threat | Baseline / Future control |
| --- | --- | --- |
| Developers' credentials | Captured in fixture or log | No real secrets required; in-app redaction, explicit fixture hygiene |
| Host machine | Untrusted subprocess or MCP server | No subprocess execution in starter; future isolated runner with allowlists and quotas |
| Private filesystem | Path traversal and symlink writes | Installer checks symlink ancestors and target files, project-local only |
| Local HTTP interface | Unauthenticated access | Bind 127.0.0.1; bearer token required, timing-safe comparison |
| Agent decisions | Prompt-injection through tool output | Treat payloads as untrusted data; policies outside context |
| Network | SSRF and unauthorized endpoint probing | No remote connections in starter; future egress restrictions |
| Evidence integrity | False PASS claims | Distinguish imported response replay from live execution; reported vs verified |
| Release claims | Fake protocol certification | Explicit scope and version; independent TCK required for broader claims |

The current redaction helper is best effort, not a DLP solution. Real enterprise security requires additional review.
