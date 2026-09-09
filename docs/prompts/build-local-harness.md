# HLY-005 — Build a truthful local harness

Executable: [`../../prompts/build-local-harness/PROMPT.md`](../../prompts/build-local-harness/PROMPT.md)
Manifest: [`../../prompts/build-local-harness/manifest.yaml`](../../prompts/build-local-harness/manifest.yaml)

## Use it when

Only one person knows how to run the project, agent work stops at lint, or
tests depend silently on local services and data.

## Outputs

The workflow can create a concise `HARNESS.md`, detailed local-run and
prerequisite docs, golden journeys, a verification matrix, troubleshooting,
and the smallest canonical sensor needed.

## Data modes

- `READ_ONLY`: no data writes.
- `EPHEMERAL`: isolated disposable data with an explicit cleanup path.

Neither mode permits production or shared customer resources.

## Static sites

Static projects are supported through build/preview, link and asset checks,
browser smoke, console errors, and basic accessibility. API, database, queue,
and migration checks are `N/A`.

## Example

```text
Follow HLY-005 with MODE=ASSESS DATA_MODE=READ_ONLY
ALLOW_CONTAINERS=false ALLOW_INSTALL=false.
```

## Done when

Commands cite their source and directory, startup has observable readiness,
the sensor fails truthfully, applicable journeys run, cleanup succeeds,
unavailable checks remain visible, and no unrelated process or state changes.
