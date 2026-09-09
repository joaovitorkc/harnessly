# Changelog

All notable Harnessly changes are documented here. Workflow behavior follows
semantic versioning rules described in [`docs/versioning.md`](./docs/versioning.md).

## 0.1.0-beta.2 — Unreleased

### Added

- Versioned workflow, profile, capability, risk, and result contracts.
- Standard and Advanced setup profiles.
- Eleven initial Markdown-first workflows with `ASSESS` and `APPLY`.
- Portable Agent Skills plus Cursor, Claude Code, and GitHub Copilot adapters.
- Deterministic catalog, adapter, fixture, template, safety, release-directory,
  and release-archive validation.
- English and Portuguese entry documentation.
- Apache-2.0/CC BY 4.0 file-scoped licensing and generated-output exception.
- Complete one-prompt setup composition from inventory through readiness.
- Orchestrator routing records for problem-to-project delegation through each
  project's entrypoint, harness, and sensor.
- Composition locks and complete-setup result ledgers tied to readiness.

### Security

- Read-only assessment default.
- Explicit repository-content trust boundary.
- Full-commit-SHA apply entrypoints and verified release digests.
- Human gates for dangerous local actions; external and Git mutations blocked.
- Path/symlink containment, source-patch preimages, result/gate semantics, and
  clean-revision publication checks.
- Realpath containment for routed entrypoints/harnesses and network-disabled
  Corepack preflight for restricted verification.
