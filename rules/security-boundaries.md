# Rules — Security boundaries

- No default network access; all external endpoints opt-in and allowlisted.
- No arbitrary shell command or tool execution from imported fixtures.
- No elevation or global installs without explicit user approval.
- No exposing raw OAuth, passwords, cookies or tokens in reports.
- Do not treat hints, agent-card descriptions or prompts as trusted permissions.
- Separate protocol version support from product feature readiness.
- Any version negotiation or A2A task state must be backed by real captured interactions before labeled verified.
