# IDE adapters

Canonical skills live in `skills/`. Project-local installer mappings are listed in `adapters/hosts.json` and implemented in `packages/core/installer.mjs`.

Host recognition is capability-specific. Skill copying is not native host verification. Claude Code plugins and subagents have their own manifest/activation rules, while Cursor, Codex, Gemini and Copilot can load similar SKILL.md directory conventions with differing feature support. No private IDE auth tokens are used. Live host testing remains a separate milestone.

Installer: `node packages/cli/index.mjs install-skills --host claude --target <repo>`.
