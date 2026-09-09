# ADR 0001 — Markdown-first distribution

Status: accepted
Date: 2026-09-08

## Context

Users need to run a setup workflow from Cursor, Claude Code, Copilot, or another
capable coding agent without first trusting and installing a new executable.

## Decision

Canonical workflows are self-contained Markdown. Users may paste them, open a
local copy, or load a full-commit-SHA Raw GitHub URL. Maintainer scripts
validate the repository but are not required by workflow users.

## Consequences

- Onboarding remains one instruction.
- URL access is optional rather than universal.
- Host behavior cannot be enforced by a Harnessly runtime.
- Reproducibility depends on full SHAs, verified digests, fixtures, and honest
  observed evaluations; tags are discovery aliases, not immutable authority.
- A future optional CLI may preview/verify workflows, but cannot become a v0.1
  prerequisite.
