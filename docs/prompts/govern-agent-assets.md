# HLY-003 — Govern agent instructions and reusable assets

Executable: [`../../prompts/govern-agent-assets/PROMPT.md`](../../prompts/govern-agent-assets/PROMPT.md)
Manifest: [`../../prompts/govern-agent-assets/manifest.yaml`](../../prompts/govern-agent-assets/manifest.yaml)

## Use it when

A repository has accumulated `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot
instructions, skills, prompt files, or custom agents and nobody knows which
instruction wins.

## Strategies

- `STRATEGY=AUDIT`: index assets and conflicts. In apply mode, write only the
  audit document.
- `STRATEGY=CANONICALIZE`: establish portable sources and thin selected
  adapters without deleting legacy files.

## Design rule

Persistent facts and global invariants belong in `AGENTS.md`. Repeatable,
on-demand procedures belong in Agent Skills. Deep explanation belongs in docs.
Native adapter files must not become independent sources of truth.

## What it will not do

- install plugins, hooks, MCP servers, or user-level settings;
- delete or rename legacy instructions;
- claim advisory tool lists are a sandbox;
- give specialized agents production, secret, or Git-write access.

## Example

```text
Follow HLY-003 with MODE=ASSESS STRATEGY=CANONICALIZE
TARGET_AGENTS=CURSOR,CLAUDE_CODE,GITHUB_COPILOT.
```

## Done when

Every asset has a host and scope, conflicts are explicit, each concern has one
canonical source, generated adapters retain the same authority, links and
frontmatter validate, and existing unmanaged text is preserved.
