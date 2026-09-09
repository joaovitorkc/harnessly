# Modes and profiles

Harnessly exposes two independent controls.

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

Instructions and docs live at the repository root and, when necessary, at
package roots. The nearest scoped instruction wins. Harnessly does not create
an orchestrator.

### `ADVANCED`

Harnessly creates a control-plane directory named `orchestrator/`.

- `TOPOLOGY=EMBEDDED`: it lives inside the current repository and registers
  that repository as `..`.
- `TOPOLOGY=PARENT_HUB`: it lives in a common parent and registers selected
  sibling Git roots.
- `TOPOLOGY=AUTO`: choose only when evidence is unambiguous; otherwise stop.

The profile never copies, moves, vendors, or nests source repositories.

## Examples

Read-only standard discovery:

```text
MODE=ASSESS PROFILE=STANDARD
```

Apply an embedded advanced control plane:

```text
MODE=APPLY PROFILE=ADVANCED TOPOLOGY=EMBEDDED
```

Apply does not authorize Git initialization, remote changes, or moving repos.
