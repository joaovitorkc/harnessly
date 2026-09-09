# Harnessly licensing

Harnessly uses file-scoped licensing. A repository-wide license expression
would be misleading because executable tooling and authored documentation have
different grants.

## Apache License 2.0

The following are licensed under Apache-2.0:

- `tools/**`
- `contracts/**/*.json`
- `.github/workflows/**`
- JavaScript, TypeScript, shell, and other executable source files
- package manifests and generated adapter tooling
- synthetic fixture source code

Full text: [`LICENSES/Apache-2.0.txt`](./LICENSES/Apache-2.0.txt).

## Creative Commons Attribution 4.0

The following are licensed under CC BY 4.0:

- `README*.md`, `DESIGN.md`, `HARNESS.md`, `SECURITY.md`, and guides
- `docs/**`
- `prompts/**`
- canonical agent instructions, rules, skills, and agent definitions
- human-authored templates

Full text: [`LICENSES/CC-BY-4.0.txt`](./LICENSES/CC-BY-4.0.txt).

## Generated-output permission

Files produced inside a user's target repository by following a Harnessly
workflow receive the additional permission in
[`OUTPUT-EXCEPTION.md`](./OUTPUT-EXCEPTION.md). Those outputs do not have to
carry a Harnessly license notice or attribution.

This permission does not remove attribution requirements when redistributing
Harnessly's prompts, guides, skills, rules, or templates themselves.

## Per-file resolution

[`REUSE.toml`](./REUSE.toml) records the machine-readable path mapping. An
explicit SPDX identifier in an individual file takes precedence over the
directory mapping.

Third-party material, if ever added, must be listed in
[`NOTICE.md`](./NOTICE.md) with its source, immutable revision, and license.
