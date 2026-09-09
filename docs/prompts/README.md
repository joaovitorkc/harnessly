# Harnessly workflow catalog

## Not sure where to start?

Use [`setup-workspace`](./setup-workspace.md). It maps the whole project and
then runs every safe applicable setup stage in the same conversation.

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
Analyze this project and show me the complete internal setup: instructions, design, skills, sensors, and everything else that applies. Do not change anything yet.
```

When the plan looks right, say “apply the plan you just showed me” in the same
chat. You do not need to rebuild the command or deal with a version
placeholder.

## Pick one specific job

- [`inventory-workspace`](./inventory-workspace.md): map repos, packages,
  stacks, and commands.
- [`govern-agent-assets`](./govern-agent-assets.md): organize `AGENTS.md`,
  rules, skills, and agent-specific files.
- [`document-system-design`](./document-system-design.md): document how the
  system actually works.
- [`build-local-harness`](./build-local-harness.md): create repeatable local
  journeys and checks.
- [`establish-quality-gates`](./establish-quality-gates.md): establish one
  honest lint/type/test/build path.
- [`document-runtime-configuration`](./document-runtime-configuration.md):
  explain configuration without opening real secrets.
- [`wire-ci-verification`](./wire-ci-verification.md): run existing checks in
  CI, without adding deploy.
- [`harden-http-rate-limits`](./harden-http-rate-limits.md): add tested limits
  where a server endpoint really exists.
- [`audit-dependency-integrity`](./audit-dependency-integrity.md): inspect
  manifests, lockfiles, and supported audits.
- [`verify-repository-readiness`](./verify-repository-readiness.md): finish
  with an honest readiness report.

Open the guide, then use its executable prompt with “analyze first and do not
change anything yet.” Approve in the same chat only after reading the plan.

## What the initial prompt runs

You do not need to run this list by hand. With `SETUP_DEPTH=COMPLETE`, the
initial prompt composes it internally:

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

Each row keeps its own applicability, gates, writes, and verification. A
focused workflow can still run alone later for maintenance. `requires` means
that apply needs current evidence; an earlier composed stage may create that
evidence during the same setup.

## How the files are organized

Every workflow keeps the user guide separate from the executable prompt:

- `docs/prompts/<name>.md` explains when and why to use it;
- `prompts/<name>/PROMPT.md` is the instruction your coding agent follows;
- `prompts/<name>/manifest.yaml` is the machine-readable safety contract.

The executable prompt is self-contained. The guide helps the human but is not
required by the agent.

## Honest applicability

Every workflow starts with `APPLICABLE`, `N/A`, or `BLOCKED`. `N/A` is a valid
result only when evidence proves the capability does not exist. Unknown facts
produce `BLOCKED`.
