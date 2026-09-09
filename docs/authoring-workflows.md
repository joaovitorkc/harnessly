# Authoring Harnessly workflows

## Start with one outcome

A workflow should do one coherent job with an observable finish. If its
applicability, writes, risks, or verification vary independently, split it.

## Required artifacts

```text
prompts/<slug>/manifest.yaml
prompts/<slug>/PROMPT.md
docs/prompts/<slug>.md
tests/scenarios/<slug>.yaml
```

Add the manifest to `catalog.yaml`.

## Prompt structure

Use these headings in order:

1. `Run Contract`
2. `Objective`
3. `Applicability`
4. `Inputs`
5. `Safety Invariants`
6. `Discovery`
7. `ASSESS Procedure`
8. `APPLY Procedure`
9. `Human Gates`
10. `Verification`
11. `Result Contract`
12. `Stop Conditions`

The prompt must be self-contained, canonical, and English. Keep explanatory
history, examples, and comparison in the guide.

## Applicability

Define evidence for:

- `APPLICABLE`: enough capability and a safe implementation path;
- `N/A`: proven absence;
- `BLOCKED`: capability may exist but a required fact/tool/gate is missing.

Never use `N/A` to hide uncertainty.

## Permissions

Missing `MODE` means `ASSESS`. Assessment is R0 and causes no workspace,
dependency, Git, or external mutation.

Apply may perform only manifest-declared R1/R2 effects. R3 gets an exact gate
or stop. R4 is manual-only in v0.1.

State paths and ownership strategies. Use `structural-merge` only for parsed
data/configuration nodes; executable configuration, source, and tests use
`source-patch` with an assessed preimage digest and focused diff. See
[`preservation.md`](../contracts/v1/preservation.md). Available tools do not
grant authority.

## Project adaptation

Discover manifests, boundaries, existing conventions, and safe checks before
proposing a framework-specific change. Include explicit behavior for
inapplicable project types. Prefer existing native tools to adding a
dependency.

## Verification

Verify invariants, not expected prose from an LLM. Include:

- allowed and forbidden paths;
- check exit behavior;
- idempotency/convergence;
- secret canaries and injection traps;
- truthful `NOT_RUN` and `N/A`;
- rollback/handoff.

## Compatibility

Do not include host-specific tool calls in the canonical prompt unless the
workflow itself targets that host. Describe required capabilities in neutral
terms. Add native adapters separately.

## Version review

Increase major version for expanded writes, risk, applicability, permissions,
or changed safe defaults. Any prompt byte change makes prior eval records
stale.

## Validate

```bash
pnpm sync:adapters
pnpm verify
```

Then review the full diff and record which real hosts were not evaluated.
