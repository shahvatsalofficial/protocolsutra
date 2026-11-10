# User workflows

1. **MCP snapshot review**: validate JSON fixture -> inspect rule IDs -> classify as PASS / REVIEW / NO_GO -> link to official spec -> propose safe test plan.
2. **A2A agent-card review**: parse JSON -> validate basic required fields -> check interface URL/binding -> identify untested task lifecycle and auth flows.
3. **Recorded replay**: load suite -> validate JSON-RPC pair -> evaluate expected outcome, error code and subset -> block unauthorized success -> report explicit not-run cases.
4. **Compatibility grid**: import host/protocol/version claims -> label reported vs untested -> identify missing live-run evidence -> schedule host testing.
5. **Security audit**: review scope -> apply static and mock negative checks -> do not execute arbitrary tools -> prioritize remediation and requested permission changes.
6. **Release gate**: collect signed run artifacts and test coverage -> compare regressions -> human reviewer approval -> publish bounded compatibility matrix.
