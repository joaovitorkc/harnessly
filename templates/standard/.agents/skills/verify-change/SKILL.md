---
name: verify-change
description: Review the current change against this project's harness and run the canonical sensor. Use after implementation and before calling the work done.
license: CC-BY-4.0
compatibility: Requires repository read access and the project sensor documented in HARNESS.md.
metadata:
  version: "0.1.0"
  owner: project
---

<!-- harnessly:owned workflow=setup-workspace version=1.0.0-beta.1 -->

# Verify a change

1. Read `AGENTS.md`, `DESIGN.md`, and `HARNESS.md`.
2. Re-read the user's request and the full relevant diff.
3. Run the canonical sensor from `HARNESS.md` when it is cheap and safe.
4. Exercise the changed path at the level the harness requires.
5. Report `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`, and `N/A` honestly.
6. State residual risks and what was not verified.

Do not commit or push unless the user explicitly asked in the current task.
