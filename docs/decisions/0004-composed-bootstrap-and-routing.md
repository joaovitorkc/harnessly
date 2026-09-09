# ADR 0004 — Complete bootstrap and project routing

## Status

Accepted.

## Context

The original setup workflow installed a safe outer foundation, while inventory,
deep documentation, quality, CI, security, and readiness remained separate
workflows. That made the advertised two-message onboarding look complete when
it was only the first stage.

The Advanced profile also created a protected `orchestrator/`, but its routing
map was a placeholder. It could reference repositories without yet carrying
enough evidence to turn a user problem into one selected project, entrypoint,
harness, and sensor.

## Decision

`setup-workspace` is the complete bootstrap entrypoint.

- Its manifest declares an ordered `composes` list.
- A composition lock pins every child manifest version and SHA-256 plus the
  terminal readiness stage.
- Its self-contained prompt embeds the procedures required by every composed
  stage and never fetches child prompts at runtime.
- The effective effect set is the union of the parent and named child
  manifests; child ownership, applicability, gates, and verification remain
  intact.
- Complete setup ends with `verify-repository-readiness`.
- Complete results contain all ten child states and cannot be `APPLIED` unless
  readiness is `READY`.
- `FOUNDATION` remains available only as an explicitly partial setup depth.

Advanced project registries include routing evidence: name, role, signals,
exclusions, entrypoint, harness, and optional sensor hint. The Orchestrator
selects one project before loading project instructions, then delegates work
and verification to that project's own harness.

## Consequences

- One prompt can complete every safe applicable internal setup stage.
- Material R3 choices may require additional approval messages in the same
  chat; “one prompt” does not mean one blanket authorization.
- Writes across multiple Git roots use one machine-readable composition gate
  naming every target.
- A blocked or non-applicable child remains visible and prevents false
  readiness.
- Focused workflows remain independently useful for later maintenance.
- The Orchestrator stays Markdown-first and does not become a runtime, service,
  or source-code root.
