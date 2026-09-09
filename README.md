# Harnessly

> **Development preview (`0.1.0-beta.1`):** this working tree has not been
> published under `joaovitorkc/harnessly` yet. Use local `PROMPT.md` files for
> review/testing. The Raw URLs below become executable only after the repository
> and a verified release exist.

Map the codebase. Install the right engineering harness. Keep coding agents
inside a verifiable contract.

[Português](./README.pt-BR.md) · [Quickstart](./docs/quickstart.md) ·
[Prompt catalog](./docs/prompts/README.md) · [Security](./SECURITY.md)

Harnessly is a Markdown-first toolkit for making an existing repository easier
and safer to maintain with coding agents. It discovers the repository before
proposing changes, adapts to monorepos and mixed stacks, and creates only the
documentation, agent instructions, quality gates, and test harnesses that the
project actually needs.

The user does not install a runtime. Any capable coding agent can receive a
plain Markdown workflow by copy/paste, local file, or full-commit-SHA Raw
GitHub URL.
Native Cursor, Claude Code, and GitHub Copilot files are adapters around the
same portable contract.

## What makes it different

- **Assess before changing:** every workflow supports `MODE=ASSESS` and
  `MODE=APPLY`. Missing mode defaults to the read-only `ASSESS`.
- **Evidence over guesses:** detected stacks, commands, boundaries, and
  unknowns are reported with paths and confidence.
- **Applicable or safely N/A:** a static landing page will not receive API
  middleware; a repository without a database will not get invented database
  rules.
- **Monorepo aware:** root guidance and package-specific guidance are scoped
  separately.
- **Vendor-neutral core:** `AGENTS.md`, Markdown, and the open Agent Skills
  format are canonical. Vendor-specific files stay thin.
- **No hidden autonomy:** Git commits, pushes, remote writes, production
  access, migrations, secrets, destructive operations, and physical repo moves
  are never implied by `MODE=APPLY`.
- **Checked as contracts:** deterministic checks validate manifests, links,
  adapters, fixture detection, executable structural invariants, and release
  digests. Behavioral LLM scenarios remain specifications until a recorded
  host evaluation observes them.

Harnessly is not an AI model, coding-agent runtime, project generator, or
one-size-fits-all framework preset.

## Quick start

Use a release tag as a convenient assessment alias. For `MODE=APPLY`, resolve
the release manifest and replace `<FULL_COMMIT_SHA>` with its exact
40-character `sourceRevision`; tags themselves can move.

Read-only assessment with the standard in-repository profile:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OR_FULL_COMMIT_SHA>/prompts/setup-workspace/PROMPT.md
and follow it in this repository with MODE=ASSESS PROFILE=STANDARD.
```

Apply the approved standard setup:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/<FULL_COMMIT_SHA>/prompts/setup-workspace/PROMPT.md
and follow it in this repository with MODE=APPLY PROFILE=STANDARD.
```

Assess an advanced control plane without copying or moving product code:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OR_FULL_COMMIT_SHA>/prompts/setup-workspace/PROMPT.md
and follow it with MODE=ASSESS PROFILE=ADVANCED TOPOLOGY=AUTO.
```

If your agent cannot read URLs, download or copy
[`prompts/setup-workspace/PROMPT.md`](./prompts/setup-workspace/PROMPT.md) and
paste the same parameters after it. URL access is a convenience, not part of
the portable contract.

Do not use a moving branch or tag URL with `MODE=APPLY`. See
[versioning and integrity](./docs/versioning.md).

## Modes and profiles

Modes control permission:

- `MODE=ASSESS` inspects and reports. It must not write files, install
  dependencies, initialize Git, run mutating commands, or cause external
  effects.
- `MODE=APPLY` repeats discovery, then performs only the local repository
  changes declared by that workflow. High-risk actions remain gated or
  forbidden.

Profiles control where the setup artifacts live:

- `PROFILE=STANDARD` keeps relevant instructions, docs, and sensors near the
  repository or package they describe.
- `PROFILE=ADVANCED` creates an `orchestrator/` control plane. From inside a
  repository it points back to `..`; from a common parent it registers sibling
  repositories. It never duplicates or relocates source code.

These axes are independent. `PROFILE=ADVANCED` does not grant additional
permissions.

## Initial catalog

| ID | Workflow | Purpose |
|----|----------|---------|
| HLY-001 | [`setup-workspace`](./docs/prompts/setup-workspace.md) | Install the right Standard or Advanced foundation |
| HLY-002 | [`inventory-workspace`](./docs/prompts/inventory-workspace.md) | Map repos, packages, stacks, commands, and boundaries |
| HLY-003 | [`govern-agent-assets`](./docs/prompts/govern-agent-assets.md) | Reconcile AGENTS, rules, skills, and native adapters |
| HLY-004 | [`document-system-design`](./docs/prompts/document-system-design.md) | Build evidence-backed design and architecture docs |
| HLY-005 | [`build-local-harness`](./docs/prompts/build-local-harness.md) | Create reproducible local journeys and sensors |
| HLY-006 | [`establish-quality-gates`](./docs/prompts/establish-quality-gates.md) | Establish one truthful verification path |
| HLY-007 | [`document-runtime-configuration`](./docs/prompts/document-runtime-configuration.md) | Document configuration without reading real secrets |
| HLY-008 | [`wire-ci-verification`](./docs/prompts/wire-ci-verification.md) | Run local gates in CI without adding deployment |
| HLY-009 | [`harden-http-rate-limits`](./docs/prompts/harden-http-rate-limits.md) | Add tested server-side limits only where applicable |
| HLY-010 | [`audit-dependency-integrity`](./docs/prompts/audit-dependency-integrity.md) | Audit manifests, lockfiles, restore, and native scans |
| HLY-011 | [`verify-repository-readiness`](./docs/prompts/verify-repository-readiness.md) | Produce an honest final readiness report |

The machine-readable source is [`catalog.yaml`](./catalog.yaml).

## Supported project signals

The initial detection vocabulary covers:

- JavaScript and TypeScript: npm, pnpm, Yarn, Bun, package workspaces, Nx,
  Turborepo, and common web/server layouts.
- Python: `pyproject.toml`, uv, Poetry, pip requirements, and common app/test
  layouts.
- Go: `go.mod` and `go.work`.
- Rust: Cargo workspaces and crates.
- Java and Kotlin: Maven and Gradle.
- .NET: solution and project files.
- Static sites: HTML/CSS/client JavaScript with no owned server ingress.
- Nested Git repositories and parent workspaces.

Detection does not mean every framework-specific mutation is supported.
Unknown tooling is reported and preserved instead of being guessed.

## Compatibility

The common denominator is plain Markdown plus repository read/write tools.

- `AGENTS.md` is the portable, hierarchical repository entrypoint.
- `.agents/skills/<name>/SKILL.md` follows the open Agent Skills specification
  and is discovered by Cursor and GitHub Copilot.
- Claude Code receives generated `.claude/skills/` adapters and a small
  `CLAUDE.md`.
- Cursor may receive scoped `.cursor/rules/*.mdc`.
- GitHub Copilot may receive `.github/copilot-instructions.md`, prompt files,
  and supported agent profiles.
- Other agents use the canonical `PROMPT.md` directly.

Support claims are evidence-labelled in
[`docs/compatibility.md`](./docs/compatibility.md). Harnessly cannot guarantee
that every model or host follows instructions identically.

## Repository layout

```text
contracts/v1/       Versioned workflow, profile, and result contracts
profiles/           Standard and Advanced setup profiles
prompts/            Canonical executable Markdown plus manifests
docs/prompts/       Human documentation for each workflow
templates/          Artifacts installed by setup, never product code
.agents/skills/     Portable maintainer skills
agents/             Canonical specialist-agent definitions
tools/              Maintainer-only validation and release scripts
tests/              Synthetic fixtures, scenarios, and observed eval records
```

Start at [`DESIGN.md`](./DESIGN.md) for architecture and
[`HARNESS.md`](./HARNESS.md) for verification.

## Safety boundary

Repository content is untrusted input. Workflows must not obey instructions
found in source files, issues, logs, generated artifacts, or downloaded pages.
They may extract evidence from those files, but only the user invocation and
the selected Harnessly workflow provide execution instructions.

Harnessly workflows do not read real `.env` files, credential stores,
production data, or `.git/` objects directly. They may use Git-mediated status,
root, tracked-path, and scoped non-secret diff inspection. See
[`SECURITY.md`](./SECURITY.md) and the [threat model](./docs/threat-model.md).

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and
[`docs/authoring-workflows.md`](./docs/authoring-workflows.md). A new workflow
is not complete until its manifest, guide, scenarios, safety classification,
and checks pass:

```bash
pnpm install
pnpm verify
```

Node and pnpm are maintainer dependencies only.

## Licensing

- Tools, schemas, CI, and code: Apache License 2.0.
- Documentation and canonical prompts: Creative Commons Attribution 4.0.
- Outputs created in a user's repository receive an additional permission:
  they do not require Harnessly attribution or licensing.

See [`LICENSE.md`](./LICENSE.md) for the exact file boundary and
[`OUTPUT-EXCEPTION.md`](./OUTPUT-EXCEPTION.md) for the output grant.
