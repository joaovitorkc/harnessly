# HLY-002 — Inventory a repository or workspace

Executable: [`../../prompts/inventory-workspace/PROMPT.md`](../../prompts/inventory-workspace/PROMPT.md)
Manifest: [`../../prompts/inventory-workspace/manifest.yaml`](../../prompts/inventory-workspace/manifest.yaml)

## Use it when

You need a trustworthy map before writing architecture docs, adding quality
gates, or changing a mixed repository.

It recognizes package/workspace signals for npm, pnpm, Yarn, Bun, uv, Poetry,
pip, Go, Cargo, Maven, Gradle, .NET, static sites, infrastructure, CLIs, and
docs-only products.

## What it records

- Git and workspace boundaries;
- project unit role and confidence;
- manifests, lockfiles, entrypoints, and local relationships;
- commands with the file that proves each command;
- owned HTTP/database/queue/scheduler surfaces;
- conflicts, exclusions, and unknowns.

## Important behavior

The workflow does not run installs, builds, tests, or application code.
Framework convention is not accepted as proof of a command. A nested Git root
becomes its own unit.

`MODE=APPLY` writes only `docs/inventory/` or the corresponding Advanced
control-plane path.

## Example

```text
Follow HLY-002 with MODE=ASSESS TARGET_ROOT=. MAX_DEPTH=6.
```

For an existing parent registry:

```text
Follow HLY-002 with MODE=APPLY SCOPE=ALL_REGISTERED.
```

## Done when

Every discovered manifest belongs to exactly one unit, workspace membership
reconciles, commands cite evidence, links resolve, uncertainty remains visible,
and a second render is unchanged.
