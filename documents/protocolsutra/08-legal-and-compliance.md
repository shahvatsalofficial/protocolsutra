# Legal and Compliance Notes

> This page is an engineering transparency statement, not legal advice. Consult a qualified lawyer for decisions that depend on it.

## License

ProtocolSutra AI is released under the **Apache License 2.0** (see `LICENSE`). You may use, modify and distribute it, including commercially, under the license terms. It includes an express patent grant and a warranty disclaimer. Attribution to the original author, **Vatsal Shah**, is preserved in `NOTICE`.

## Dependencies and third-party code

The runtime has **zero third-party dependencies**; it uses only Node.js built-in modules. Development dependencies: none. There is therefore no third-party license to propagate. The project does not bundle code from the MCP or A2A projects.

## Names and trademarks

- "Model Context Protocol" and "MCP" are associated with Anthropic and the MCP project. "A2A" / "Agent2Agent" are associated with the A2A project (Linux Foundation). Other product names (Claude, Cursor, Codex, Gemini, Copilot, VS Code…) belong to their owners.
- ProtocolSutra AI is an **independent project**. It is **not affiliated with, endorsed by or certified by** any of those organisations. Names are used only to describe compatibility targets (nominative use).
- Availability of the names "ProtocolSutra" and "protocolsutra" on npm and GitHub was observed at publication time. No trademark search has been performed and no trademark is claimed. Verify before commercial branding.

## What the project does not claim

| Never claimed | Why |
|---|---|
| Official MCP or A2A conformance or certification | The tool evaluates captured snapshots against a local structural profile |
| SOC 2, ISO 27001, NIST, OWASP, GDPR or HIPAA compliance | No such audit has been performed |
| "100 % secure" or "detects all attacks" | Detection is heuristic and demonstrably evadable |
| Support for any specific IDE | Skills are copied to documented directories; activation is not verified |
| Live interoperability results | No live runner exists yet |

## Privacy

- The tool performs no network calls and sends no telemetry.
- Inputs and reports stay on the machine where they are produced.
- Redaction is best-effort. Review reports before sharing them publicly.
- The optional report server listens on localhost only.
- No personal data is collected by the project or by the npm package.

## Security of the supply chain

- Releases are published from CI with npm provenance when available.
- Releases carry sample reports and the test evidence for that version.
- Report vulnerabilities as described in `SECURITY.md`.

## Using reports as evidence

A report shows what a given version of the tool concluded about a given input at a given digest. It is suitable for engineering review. It is not a certificate, warranty or attestation of third-party fitness. Do not present a `PASS` as proof of compliance to customers or regulators.

## Contributions

Contributions are accepted under Apache-2.0 (inbound = outbound). By submitting a pull request you confirm you have the right to contribute the code. See `CONTRIBUTING.md` and `GOVERNANCE.md`.

## Warranty

The software is provided "as is", without warranty of any kind, as stated in sections 7 and 8 of the Apache License 2.0.
