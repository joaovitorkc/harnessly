# ADR 0002 — Separate permission modes from setup profiles

Status: accepted
Date: 2026-09-08

## Context

“Normal versus advanced layout” and “assess versus make changes” answer
different questions. Combining them makes advanced look more privileged and
creates four drifting prompts.

## Decision

- `MODE=ASSESS|APPLY` controls authority; missing mode is `ASSESS`.
- `PROFILE=STANDARD|ADVANCED` controls artifact placement.
- One setup workflow handles both profiles.
- Advanced has safe `EMBEDDED` and `PARENT_HUB` topologies.
- No topology copies or moves product code.

## Consequences

The four combinations remain explicit and testable. Advanced is not more
autonomous. Physical repository migration requires a separate future workflow
and risk review.
