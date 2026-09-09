<!-- harnessly:owned workflow=setup-workspace version=1.0.0-beta.1 -->
# AGENTS.md — {{WORKSPACE_NAME}} orchestrator

This directory is a control plane. Product code remains in the repositories
registered by `projects.yaml`. Start here with a problem; route it to the right
project before loading project-specific context.

## Route first

1. Read `projects.yaml` and its `routingDoc`.
2. Validate its schema, `authorizedRoot`, unique IDs, relative paths, symlink
   containment, and expected Git roots.
3. Match the user's language to project roles, signals, and exclusions.
4. Identify exactly one target project. If two remain plausible, ask one
   focused question before reading either project's instructions.
5. Resolve and read the selected project's `entrypoint` and `harness`. Do not
   edit product source before both are loaded.
6. Work inside the selected project repository and use its own sensor.
7. For a cross-project task, name every affected Git root and obtain the
   explicit multi-repository gate before any product write.

## Control-plane contents

- `DESIGN.md`: workspace topology and ownership.
- `HARNESS.md`: cross-project sensors and completion contract.
- `docs/routing/`: request-to-project routing.
- `docs/inventory/`: project and command evidence used by routing.
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
`HARNESS.md`. A sensor recorded in `projects.yaml` is only a routing hint until
the selected project's harness confirms it. Report what was not verified.
