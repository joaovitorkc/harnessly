# HLY-008 — Wire local verification into CI

Executable: [`../../prompts/wire-ci-verification/PROMPT.md`](../../prompts/wire-ci-verification/PROMPT.md)
Manifest: [`../../prompts/wire-ci-verification/manifest.yaml`](../../prompts/wire-ci-verification/manifest.yaml)

## Use it when

A canonical local sensor exists and the same checks need to run on pull
requests or pushes.

## v0.1 provider scope

The workflow can create GitHub Actions verification or conservatively extend a
recognized existing provider. Unknown CI syntax becomes `BLOCKED`.

## Security defaults

- read-only permissions;
- no secrets on untrusted pull-request code;
- no `pull_request_target`;
- third-party actions pinned to full commit SHAs;
- frozen/locked dependency restore;
- no deploy, publish, release, signing, or production environment.

Harnessly reuses a pin already approved in the repository or one supplied by
the user with provenance. It does not guess/fetch a new SHA during the
workflow; missing pins block apply.

## Example

```text
Follow HLY-008 with MODE=ASSESS PROVIDER=GITHUB_ACTIONS
TRIGGERS=pull_request,push RUNTIME_MATRIX=AUTO.
```

## Done when

CI calls the same local sensor, runtime and manager versions have evidence,
permissions are minimal, matrix cost is bounded, actions are immutable, and
remote execution remains explicitly `NOT_RUN` until a commit is pushed.
