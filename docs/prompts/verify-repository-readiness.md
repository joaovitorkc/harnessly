# HLY-011 — Verify repository readiness

Executable: [`../../prompts/verify-repository-readiness/PROMPT.md`](../../prompts/verify-repository-readiness/PROMPT.md)
Manifest: [`../../prompts/verify-repository-readiness/manifest.yaml`](../../prompts/verify-repository-readiness/manifest.yaml)

## Use it when

You want a final, reproducible audit after setup or before trusting longer
agent work.

## Readiness areas

Identity, agent entrypoints, system knowledge, local harness, quality,
security, dependency integrity, CI, continuity, and closure.

Applicability is capability-based. A static site does not fail because it has
no database or HTTP rate limiter.

## Grades

- `READY`: every mandatory applicable criterion has current passing evidence.
- `CONDITIONALLY_READY`: no known failure, but mandatory evidence is not run,
  blocked, or stale.
- `NOT_READY`: at least one mandatory applicable criterion fails.

File existence alone is not evidence of behavior.

## Example

```text
Follow HLY-011 with MODE=APPLY REQUIRED_WORKFLOWS=AUTO
RUN_EXPENSIVE=false EVIDENCE_MAX_AGE_DAYS=30.
```

## Done when

Every criterion has a reproducible state and evidence, `N/A` is justified,
staleness is computed, grade recalculates from the matrix, no gap is silently
fixed, and remote/unrun checks remain visible.
