# Contributing to ProtocolSutra AI

Thank you for improving open interoperability tooling. Start with a small reproducible fixture and an issue explaining the affected protocol version.

1. Fork/checkout the repository and run `npm test`.
2. Add the smallest failing fixture/test before implementing a correction.
3. Run `npm run demo` and check sample reports remain honest.
4. Include spec links and supported versions for protocol behavior claims.
5. Explain backwards compatibility, security considerations and what you verified.
6. Do not submit real access tokens, confidential traces, customer logs or production endpoints.

PRs adding a new host or SDK adapter must include a recorded end-to-end test, explicit permission scope and a capabilities matrix. Avoid mass-generated placeholder PRs.
