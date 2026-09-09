# Quickstart

> **Public preview:** the repository is live; the first tagged release is
> still being prepared. The URL below uses `main` for read-only assessment.
> Apply in the same chat so the agent reuses the already loaded workflow.

Harnessly is a set of Markdown workflows. You do not install it in the project.

## The fast path

### 1. Open your coding agent in the target project

The target project is the codebase you want Harnessly to prepare — not the
Harnessly repository.

### 2. Send this message

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
Analyze this project and show me the setup you recommend. Do not change anything yet.
```

The first pass is read-only. The agent maps the repositories, packages,
commands, docs, and missing checks, then shows the proposed paths.

### 3. Review the plan

Ask questions or request changes in normal language. Nothing has been edited.

### 4. Approve in the same chat

```text
Apply the plan you just showed me. Verify the result and tell me what you could not check.
```

Stay in the same chat so the agent reuses the exact workflow it already read.
Do not paste the URL again for apply.

## Want the advanced layout?

Use this first message instead:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
I want the advanced setup with an orchestrator folder. Analyze first and do not change anything yet.
```

The advanced layout points to existing repositories. It never copies or moves
their code:

```text
workspace/
├── orchestrator/       # shared guidance and project registry
├── web/                # remains where it is
└── api/                # remains where it is
```

## Want just one check?

Pick a workflow from the [catalog](./prompts/README.md). For example:

```text
Read https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/harden-http-rate-limits/PROMPT.md
Check whether this project needs rate limiting. Show me the plan and do not change anything yet.
```

If the project is a static site with no server endpoint, the honest result is
`N/A`: there is nowhere useful to install server-side rate limiting.

## The technical words, translated

- **Assess (`ASSESS`)** means “look and explain, but do not edit.”
- **Apply (`APPLY`)** means “perform the approved local changes and verify.”
- **Standard (`STANDARD`)** keeps guidance close to the code.
- **Advanced (`ADVANCED`)** adds an `orchestrator/` for several repositories.
- A **tag** is a friendly release name such as `v0.1.0-beta.1`.
- A **commit SHA** is the exact fingerprint of one repository snapshot.

You do not need to type a tag or SHA in the normal flow: the release URL is
already complete, and apply happens in the same chat. Full-SHA instructions
exist for automation and separate-session verification in
[versioning](./versioning.md).

## What a good result tells you

- what the agent found and where;
- what it plans to create or change;
- what is not relevant (`N/A`) or still blocked;
- which checks passed, failed, or were not run;
- what remains for a human to verify.

## Keep these safety basics

- Start the agent at the intended project or workspace root.
- Keep production credentials unavailable.
- Read the proposed plan before approving.
- Review the final diff before you commit.
- If you start a separate apply chat, follow the full-SHA instructions in
  [versioning](./versioning.md).
