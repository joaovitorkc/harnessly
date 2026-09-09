# Contributing to Harnessly

Harnessly accepts small, evidence-backed improvements. A workflow is a public
execution contract, so changing one has a higher bar than editing prose.

## Before opening a change

1. Read [`AGENTS.md`](./AGENTS.md), [`DESIGN.md`](./DESIGN.md), and
   [`docs/authoring-workflows.md`](./docs/authoring-workflows.md).
2. Search the catalog for overlapping scope.
3. Open an issue for a new workflow or a change that expands permissions,
   writes, applicability, defaults, or risk.
4. Do not include private code, production topology, credentials, copied
   prompts, or generated output from a customer repository.

## Local checks

```bash
pnpm install
pnpm verify
```

The user-facing toolkit remains zero-install. Node and pnpm are used only to
validate this repository.

## Workflow checklist

- Add or update one manifest, one canonical `PROMPT.md`, and one guide.
- Keep `PROMPT.md` self-contained and in English.
- Support both `ASSESS` and `APPLY`.
- Default to `ASSESS` when mode is absent.
- Declare applicability, parameters, writes, risks, gates, checks, and stop
  conditions.
- Add scenario expectations based on invariants, never exact LLM wording.
- Record unsupported stacks as `N/A` or `BLOCKED`; do not guess.
- Verify a second deterministic application produces no extra change.
- Update catalog and changelog.

## Compatibility claims

Use only these evidence labels: `not-run`, `observed-pass`, `partial`,
`observed-fail`, or `stale`. Include host, model, date, workflow digest,
fixture digest, permissions, diff, and checks. Do not write “works with every
AI.”

## Commits and pull requests

Keep unrelated changes separate. Explain risk changes and list checks actually
run. A passing static validator does not replace a scenario or host evaluation.

By contributing, you agree that your contribution is licensed according to
[`LICENSE.md`](./LICENSE.md) and that generated outputs receive the permission
in [`OUTPUT-EXCEPTION.md`](./OUTPUT-EXCEPTION.md).
