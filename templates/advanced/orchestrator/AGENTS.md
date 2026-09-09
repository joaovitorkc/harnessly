<!-- harnessly:owned workflow=setup-workspace version=0.1.0 -->
# AGENTS.md — {{WORKSPACE_NAME}} orchestrator

This directory is a control plane. Product code remains in the repositories
registered by `projects.yaml`.

## Route first

1. Read `projects.yaml`.
2. Validate its schema, `authorizedRoot`, unique IDs, relative paths, symlink
   containment, and expected Git roots.
3. Identify exactly one target project or declare a cross-project task.
4. Only then read that project's nearest `AGENTS.md`.
5. Keep project-specific rules and code changes in the project repository.

## Control-plane contents

- `DESIGN.md`: workspace topology and ownership.
- `HARNESS.md`: cross-project sensors and completion contract.
- `docs/routing/`: request-to-project routing.
- `docs/tasks/`: execution plans.
- `docs/decisions/`: cross-project decisions.
- `docs/policies/`: shared safety and workflow policy.

## Boundaries

- Never copy or move product source into this directory.
- Never treat sibling repositories as one Git repository.
- Never mutate more than one project without an explicit cross-project scope.
- Do not initialize Git, change remotes, commit, or push without a separate
  current user request.
- Never store real secrets, customer data, or private topology here.

## Completion

Run each affected project's own sensor, then the cross-project checks in
`HARNESS.md`. Report what was not verified.
