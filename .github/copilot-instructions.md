# Harnessly repository instructions

Read `AGENTS.md` before work and the nearest nested `AGENTS.md` for scoped
files.

Harnessly's canonical workflow sources are `contracts/v1/`, `catalog.yaml`,
and `prompts/`. `.agents/skills/` is canonical; generated adapters must not be
edited directly.

Every workflow supports read-only `ASSESS` and scoped local-write `APPLY`.
Never widen authority to secrets, production, external writes, destructive
actions, or Git mutation.

Run `pnpm verify`, review the complete diff, and report real host evaluations
that were not run.
