# ADR 0003 — Portable core and generated adapters

Status: accepted
Date: 2026-09-08

## Context

Major coding agents support overlapping Markdown and Agent Skills concepts but
use different discovery paths, frontmatter, and precedence.

## Decision

`AGENTS.md`, `.agents/skills/`, canonical agent definitions, contracts, and
`PROMPT.md` are sources of truth. Claude Code and Copilot agent adapters are
generated. Cursor rules are used only where scoped rule metadata adds value.

Adapters cannot broaden capabilities or contain independent workflow logic.

## Consequences

- Cursor and Copilot can consume the open skill location directly.
- Claude Code gets native discovery without a second manually maintained
  workflow.
- Generated files must be synchronized and validated.
- Vendor changes affect adapters and compatibility evidence, not the portable
  execution contract.
