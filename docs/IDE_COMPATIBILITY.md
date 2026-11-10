# IDE and Server Compatibility — Evidence Rules

**Host path is not proof of host execution.** Current capability: copy Agent Skills to project-local paths. Real host activation remains untested in this environment.

| Host | Project skill path | Skill installer | Verified live protocol execution |
| --- | --- | --- | --- |
| Claude Code | `.claude/skills/` | Yes | No |
| Cursor | `.cursor/skills/` | Yes | No |
| Codex | `.agents/skills/` | Yes | No |
| Gemini CLI | `.gemini/skills/` | Yes | No |
| GitHub Copilot | `.github/skills/` | Yes | No |
| Generic skills host | `.agents/skills/` | Yes | No |

Compatible server modes may include stdio MCP, Streamable HTTP and authenticated A2A endpoints, but require proper protocol adapters and tests. The included localhost report server is **not an MCP or A2A protocol endpoint**; it is an internal read-only JSON viewer.

Capture host name, binary version, OS, protocol binding, protocol version, agent/skill activated, test ID, result, provenance and limitations before claiming compatibility.
