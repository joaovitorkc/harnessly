# Quickstart

> This is a development preview. Until `joaovitorkc/harnessly` and a verified
> release are published, use the local `prompts/<slug>/PROMPT.md` files. The
> example Raw URLs are future release entrypoints.

Harnessly workflows are Markdown files. You can use them without installing
Harnessly.

## 1. Choose permission and layout

- `MODE=ASSESS`: inspect and report only. This is the default.
- `MODE=APPLY`: perform declared local writes, then verify.
- `PROFILE=STANDARD`: keep guidance close to the code.
- `PROFILE=ADVANCED`: create an `orchestrator/` control plane without moving
  code.

Mode controls permission. Profile controls organization.

## 2. Use a version-pinned workflow

Use a release tag as an assessment alias:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OR_FULL_COMMIT_SHA>/prompts/setup-workspace/PROMPT.md
and follow it in this repository with MODE=ASSESS PROFILE=STANDARD.
```

Review the assessment. To apply:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/<FULL_COMMIT_SHA>/prompts/setup-workspace/PROMPT.md
and follow it in this repository with MODE=APPLY PROFILE=STANDARD.
```

If URL access is unavailable, paste the local or downloaded `PROMPT.md`.

## 3. Check the report

A complete result states:

- applicability and evidence;
- mode, profile, topology, target root, and detected units;
- planned or applied paths;
- gates and stop reasons;
- checks with `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`, `N/A`, or `STALE`;
- residual risks and unverified items.

Applicability is `APPLICABLE` when the workflow fits, `N/A` when evidence
proves the capability is absent, and `BLOCKED` when required facts or
permissions are unresolved. `NOT_RUN`, `BLOCKED`, and `STALE` checks are not
success.

## 4. Advanced topology

From inside one repository:

```text
repo/
├── existing-code/
└── orchestrator/       # registry points to ..
```

From a common parent:

```text
workspace/
├── orchestrator/       # registry points to sibling repos
├── web/
└── api/
```

Harnessly does not copy or move the repositories. If topology is ambiguous,
the workflow stops and asks for `TOPOLOGY=EMBEDDED|PARENT_HUB`.

## 5. Run a focused workflow

Example: assess rate limiting only:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OR_FULL_COMMIT_SHA>/prompts/harden-http-rate-limits/PROMPT.md
and follow it with MODE=ASSESS.
```

A static or client-only site must return `N/A`. An HTTP service must still
prove its owned ingress, deployment shape, proxy trust, identity key, and test
surface before apply.

## Safety notes

- Run `MODE=APPLY` only from the full commit SHA recorded by the verified
  release manifest, not from a moving branch or tag.
- Inspect the selected version and release digest.
- Start the agent at the intended repository or parent workspace root.
- Keep production credentials unavailable.
- Review `git diff` yourself before committing.
