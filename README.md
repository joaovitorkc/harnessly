> [!NOTE]
> **Harnessly is in public preview.** The repository is live; the first tagged
> release is still being prepared. The starter below uses `main` only for a
> read-only assessment. If you approve in the same chat, the agent reuses the
> exact workflow it already loaded instead of downloading it again.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/github-banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="./assets/github-banner-light.png">
  <img src="./assets/github-banner-light.png" alt="Harnessly" width="100%">
</picture>

### Turn an existing repository into a place where coding agents can work without guessing.

Harnessly maps the project, proposes the right engineering harness, and waits
for your approval before changing files.

**One place. The right project.**

[Start in 30 seconds](#start-with-harnessly) ·
[What is Harnessly?](#what-is-harnessly) ·
[Workflow catalog](./docs/prompts/README.md) ·
[Português](./README.pt-BR.md)

</div>

---

## Start with Harnessly

No CLI. No package to install. Open your coding agent **in the project you want
to prepare**, copy this message, and send it:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
Analyze this project and show me the complete internal setup: instructions, design, skills, sensors, and everything else that applies. Do not change anything yet.
```

Harnessly maps the project and explains the plan. If it looks right, reply in
the **same chat**:

```text
Apply the plan you just showed me. Verify the result and tell me what you could not check.
```

That is the normal flow. You do not need to replace a placeholder, understand
a commit SHA, or paste the URL again. The agent reuses the exact workflow it
already assessed.

### Normal setup

One repository. You open the coding agent in that folder. After apply, the
setup lives there: `AGENTS.md`, `DESIGN.md`, `HARNESS.md`, inventory, skills,
sensor scripts, quality gates, and the rest that the project actually needs.

Later you keep working in that same folder. The agent already has the map.

### Orchestrator setup

Several projects. Harnessly creates an `orchestrator/` folder that becomes the
desk: you open the agent there and just describe the problem. It identifies
which registered project the request belongs to, loads that project's
`AGENTS.md` and `HARNESS.md`, works inside that repository, and uses that
project's own sensor to check the result.

Same operating pattern as a multi-product hub: one place to send the problem,
then the chosen project already knows how to solve it. The Orchestrator keeps
routing, plans, and references. It does not copy source code and it is not a
background service.

To choose it, change only the second line:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
I want the Orchestrator setup: a central folder where I describe a problem, it picks the right project, and that project already has its own instructions, design, skills, and sensors. Analyze first and do not change anything yet.
```

If your agent cannot open URLs, open or paste the local
[`PROMPT.md`](./prompts/setup-workspace/PROMPT.md), then send the same
plain-language request.

> [!TIP]
> **Coding agents and LLMs:** start at [`AGENTS.md`](./AGENTS.md) for the
> repository map and operating rules. Maintainers should use
> [`HARNESS.md`](./HARNESS.md) for the verification path.

## Contents

- [What is Harnessly?](#what-is-harnessly)
- [What it adds](#what-it-adds)
- [The two choices](#the-two-choices-in-plain-english)
- [Why it is safer](#why-it-is-safer-than-a-generic-setup-prompt)
- [Initial catalog](#initial-catalog)
- [Supported project signals](#supported-project-signals)
- [Compatibility](#compatibility)
- [Repository layout](#repository-layout)
- [Safety boundary](#safety-boundary)
- [Contributing](#contributing)
- [Licensing](#licensing)

## What is Harnessly?

Harnessly is a Markdown-first toolkit of engineering workflows for coding
agents. You give a workflow to the agent you already use; Harnessly gives that
agent a repeatable way to inspect the repository, explain what is missing, and
make only the changes you approve.

The initial setup prompt composes the whole applicable catalog in one
conversation. It does not stop after three index files. The default is the
complete internal setup: every relevant stage runs, then an evidence-backed
readiness grade. Anything unsafe, irrelevant, or unresolved stays visible as
gated, `N/A`, or `BLOCKED`.

The result is a project-specific **harness** — the same kind of engineering
layer used to keep several products coherent: instructions, design, skills,
sensors, and checks adapted to *this* repository. It is not a copy of another
company's product rules.

Harnessly does not force a framework or assume every repository needs the same
setup. It follows evidence. A monorepo can receive scoped package guidance; a
static landing page can correctly return `N/A` for server rate limiting; an
unknown tool remains an explicit unknown.

It is not an AI model, agent runtime, SaaS service, or replacement for the
coding agent. It is the engineering layer that makes work done through those
agents easier to understand, verify, and repeat.

<details>
<summary><strong>Why does Harnessly exist?</strong></summary>

Coding agents can read a large amount of code, but they usually enter a new
repository without the team's mental model: which commands are trustworthy,
where boundaries live, what must never be touched, and what “done” means.
Harnessly turns that missing context into maintained repository artifacts and
verifiable workflows.

</details>

## What it adds

One approved apply of the initial prompt, by default, installs the applicable
internal setup — not a thin starter. Typical files:

- `AGENTS.md` — how the agent starts, boundaries, and the verify command;
- `DESIGN.md` and `docs/design/` — how the system actually works;
- `HARNESS.md`, `docs/harness/`, and `scripts/verify-*` — local journeys and
  the canonical sensor;
- `.agents/skills/` — at least a verification skill, plus skills for
  workflows the repo already repeats;
- `docs/inventory/`, `docs/tasks/`, `docs/decisions/`, `docs/learnings.md`;
- thin Cursor, Claude Code, and Copilot adapters when those hosts are in use;
- verification-only CI when a local sensor already exists and pins are safe;
- HTTP rate limiting only when there is an owned server endpoint.

It creates what is missing and preserves what you already have. A static
landing page does not receive server middleware. An unfamiliar tool is
reported, not guessed. Extra product-specific skills (a unique screen
workflow, a custom deploy ritual) appear only when the repository already
shows that work; the prompt will not invent them.

## The two choices, in plain English

- **Look only** (`ASSESS`): inspect and explain; never edit.
- **Apply** (`APPLY`): make only the approved local changes, then verify.
- **Normal setup** (`STANDARD`): keep guidance next to the code.
- **Orchestrator setup** (`ADVANCED`): add a central routing layer that points
  to existing repositories, selects the right project for each problem, and
  loads that project's own harness without copying or moving code.

You can ignore the words in parentheses during the normal two-message flow.
They exist for automation and repeatable runs.

## Why it is safer than a generic setup prompt

- It gathers evidence before proposing files.
- Repository content is treated as untrusted data, not new instructions.
- Git commits, pushes, production access, migrations, secrets, destructive
  operations, and remote writes stay outside normal apply.
- Managed files have ownership and drift rules.
- Deterministic checks validate contracts, links, adapters, fixture detection,
  structural invariants, and release digests.

Harnessly is a prompt toolkit, not an AI model, agent runtime, framework
preset, or project generator. For pinned releases and integrity details, see
[versioning](./docs/versioning.md).

## Initial catalog

| ID | Workflow | Purpose |
|----|----------|---------|
| HLY-001 | [`setup-workspace`](./docs/prompts/setup-workspace.md) | Complete the applicable Standard or Orchestrator setup in one conversation |
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
