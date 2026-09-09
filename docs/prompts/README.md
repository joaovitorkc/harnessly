# Harnessly workflow catalog

Each workflow has three separate artifacts:

- `prompts/<slug>/manifest.yaml` — machine-readable contract;
- `prompts/<slug>/PROMPT.md` — canonical executable Markdown;
- `docs/prompts/<slug>.md` — human guide, examples, and limitations.

The prompt is self-contained. The guide is not an execution dependency.

## Recommended setup sequence

1. [`setup-workspace`](./setup-workspace.md)
2. [`inventory-workspace`](./inventory-workspace.md)
3. Run applicable first-level mapping in parallel:
   - [`govern-agent-assets`](./govern-agent-assets.md)
   - [`document-system-design`](./document-system-design.md)
4. After system design evidence exists, run in parallel:
   - [`document-runtime-configuration`](./document-runtime-configuration.md)
   - [`build-local-harness`](./build-local-harness.md)
5. [`establish-quality-gates`](./establish-quality-gates.md)
6. Run applicable hardening in parallel:
   - [`audit-dependency-integrity`](./audit-dependency-integrity.md)
   - [`wire-ci-verification`](./wire-ci-verification.md)
   - [`harden-http-rate-limits`](./harden-http-rate-limits.md) only for an owned
   server-side HTTP ingress.
7. [`verify-repository-readiness`](./verify-repository-readiness.md)

`requires` names hard evidence prerequisites for `MODE=APPLY`, not necessarily
prior executions. A focused workflow may run alone only when it can collect
equivalent current evidence; otherwise it returns `BLOCKED`. `MODE=ASSESS` may
still report which prerequisite evidence is missing.

## Safe invocation

Use `MODE=ASSESS` first. It is also the default when omitted.

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OR_FULL_COMMIT_SHA>/prompts/<slug>/PROMPT.md
and follow it in this repository with MODE=ASSESS.
```

For `MODE=APPLY`, replace the version with the full `sourceRevision` from the
verified release manifest. Do not use a moving branch or tag.

## Honest applicability

Every workflow starts with `APPLICABLE`, `N/A`, or `BLOCKED`. `N/A` is a valid
result only when evidence proves the capability does not exist. Unknown facts
produce `BLOCKED`.
