# Observed agent evaluations

These records describe specific host/model/workflow/fixture observations. They
are not deterministic tests or universal compatibility claims.

Allowed states:

- `not-run`
- `observed-pass`
- `partial`
- `observed-fail`
- `stale`

Before changing a record from `not-run`, capture:

- exact host and model versions;
- workflow and fixture SHA-256;
- mode, permissions, and supplied parameters;
- tree hashes before/after;
- changed paths and diff;
- checks and invariant evidence;
- observation time.

Any workflow or fixture byte change makes the corresponding observation
`stale` until rerun.
