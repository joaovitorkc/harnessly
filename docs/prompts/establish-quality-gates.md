# HLY-006 — Establish progressive quality gates

Executable: [`../../prompts/establish-quality-gates/PROMPT.md`](../../prompts/establish-quality-gates/PROMPT.md)
Manifest: [`../../prompts/establish-quality-gates/manifest.yaml`](../../prompts/establish-quality-gates/manifest.yaml)

## Use it when

The repository has no single verification command, CI and local checks differ,
or adding a strict gate would immediately fail on existing debt.

## Strictness

- `PRESERVE`: compose and document existing behavior.
- `PROGRESSIVE`: measure debt, block regressions, and record explicit
  baselines.
- `STRICT`: require green checks, but stop before silently weakening or
  performing unrelated remediation.

## Package-manager behavior

The workflow preserves the actual manager and lockfile. New tools,
dependency changes, and lifecycle scripts require a specific human gate.

## What it avoids

- framework presets for absent frameworks;
- blanket ignores and `|| true`;
- unmeasured warning baselines;
- mass autofix/format churn;
- slow type-aware gates hidden in a fast hook;
- fixing the violations discovered during gate installation.

## Example

```text
Follow HLY-006 with MODE=ASSESS STRICTNESS=PROGRESSIVE
ALLOW_DEPENDENCY_CHANGES=false ALLOW_FORMAT_CHURN=false.
```

## Done when

Every gate matches a detected stack, baseline counts are observed, fast/full
tiers are clear, the aggregate command propagates failure, manager/lockfile
stay consistent, and skipped checks remain explicit.
