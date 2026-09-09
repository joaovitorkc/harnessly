# Risk policy v1

Risk describes the strongest possible effect of an action, not the confidence
of the agent.

## R0 — observation

Local non-sensitive reads, repository discovery, Git status/diff inspection,
and public immutable metadata. `MODE=ASSESS` is limited to R0.

## R1 — additive

Create new Harnessly-owned files under declared paths without changing existing
behavior. Authorized by `MODE=APPLY` when the manifest declares the path.

## R2 — repository mutation

Modify shared files through managed blocks or structural merge; add local
verification scripts; execute declared checks inside the restricted
`shell.verify` envelope in `execution-contract.md`. Authorized by
`MODE=APPLY` only within the manifest and after preconditions are rechecked.

## R3 — dangerous local action

Delete or move files, initialize nested Git, change permissions, run dependency
lifecycle scripts, change dependencies, execute migrations, or touch multiple
independent repos. A unique human gate must identify the exact command, paths,
impact, rollback, and verification.

Most v0.1 workflows stop instead of executing R3. Dependency and CI workflows
may request a narrow gate when their manifests declare it.

## R4 — critical or external

Production, infrastructure, credentials, shared/external storage or database writes,
authenticated network writes, Git commit/push/tag/merge/rebase/reset, remote
changes, and destructive history operations.

R4 is `MANUAL_ONLY` in v0.1. A workflow may explain the next human action but
must not execute it.

## Gate validity

A gate approval applies only to the shown gate ID, action, target, and
preconditions. It expires if the target changes, the diff changes materially,
or the command changes. Silence and broad phrases such as “do everything” do
not approve an undisclosed R3/R4 action.

An effect with `authorization: MODE_APPLY` and `gateWhen` is R1/R2 only while
none of those declared conditions applies. If one applies, execution pauses
for the complete R3 gate contract; the mode alone is insufficient.

Selecting `MODE=APPLY` is sufficient authorization for declared R1/R2 effects.
Selecting `PROFILE=ADVANCED` grants no permission.
