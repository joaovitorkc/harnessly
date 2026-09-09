# Modes, setup depth, and profiles

Harnessly keeps permission, completeness, and organization independent.

## `MODE`

`MODE` controls authority.

### `ASSESS`

The default when omitted. The agent may inspect non-sensitive files, Git status
and diff, manifests, and local tool versions. It must not:

- write reports or temporary files;
- install or update dependencies;
- run commands that create caches, build output, or generated code;
- fetch, initialize, commit, or otherwise mutate Git;
- access authenticated services or cause external effects.

The output is an evidence-backed plan. Selecting `ASSESS` is not authorization
for a later write in the same run.

### `APPLY`

The agent repeats discovery, verifies that relevant files did not drift, and
then performs only R1/R2 effects declared by the selected workflow.

It may not infer permission for a delete, move, migration, dependency lifecycle
script, production access, external write, or Git mutation. R3 actions need a
specific gate where the workflow permits one. R4 actions are manual-only in
v0.1.

## `PROFILE`

`PROFILE` is used by `setup-workspace` and controls placement.

### `STANDARD`

This is the normal setup. Start the agent inside one repository and Harnessly
creates the applicable instructions, docs, skills, harness, sensors, and gates
there. Package-specific guidance stays at the nearest package root. Harnessly
does not create an orchestrator.

### `ADVANCED`

Harnessly creates a central control-plane directory named `orchestrator/`.
Open the coding agent there and describe the problem. The Orchestrator matches
the request to one registered project's role, signals, and exclusions, then
loads that project's `AGENTS.md` and `HARNESS.md` before work begins. The
project keeps its source and owns its final verification.

- `TOPOLOGY=EMBEDDED`: it lives inside the current repository and registers
  that repository as `..`.
- `TOPOLOGY=PARENT_HUB`: it lives in a common parent and registers selected
  sibling Git roots.
- `TOPOLOGY=AUTO`: choose only when evidence is unambiguous; otherwise stop.

The profile never copies, moves, vendors, or nests source repositories.

The Orchestrator is Markdown routing and project memory, not a background
service or agent runtime.

## `SETUP_DEPTH`

- `COMPLETE` is the default. The initial prompt runs every safe applicable
  stage from inventory through readiness and reports blocked stages honestly.
- `FOUNDATION` installs only outer entrypoints and indexes. Its result is
  explicitly partial and must not be presented as a complete setup.

## Examples

Read-only standard discovery:

```text
MODE=ASSESS PROFILE=STANDARD
```

Apply a complete embedded Orchestrator:

```text
MODE=APPLY SETUP_DEPTH=COMPLETE PROFILE=ADVANCED TOPOLOGY=EMBEDDED
```

Apply does not authorize Git initialization, remote changes, or moving repos.
