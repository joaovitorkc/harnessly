# Harnessly maintainer harness

## Prerequisites

- Node.js 22 through 24 (`.node-version` pins the CI baseline)
- pnpm 10.17.1
- no credentials, services, database, or browser required for deterministic
  checks

Install maintainer dependencies:

```bash
pnpm install
```

End users of Harnessly workflows do not run this setup.

## Canonical sensor

```bash
pnpm verify
```

It runs:

1. contract, catalog, prompt, guide, link, and safety validation;
2. generated-adapter parity;
3. fixture discovery and canary-exclusion assertions;
4. Standard/Advanced template convergence and registry containment;
5. reproducible release directory/archive and digest verification in a
   temporary directory.

## Focused commands

```bash
pnpm validate
pnpm check:adapters
pnpm test:safety
pnpm test:fixtures
pnpm test:templates
pnpm release:check
```

`pnpm sync:adapters` writes generated adapters. Review its diff.

## Golden scenarios

- Standard setup keeps artifacts near code.
- Advanced embedded registers `..` and copies no source.
- Advanced parent hub registers sibling paths and respects Git boundaries.
- `ASSESS` expectation permits no workspace change.
- Reapplying deterministic templates produces no additional change.
- A static landing is `N/A` for HTTP rate limiting.
- A server fixture remains `BLOCKED` until identity/proxy/store decisions are
  explicit.

The deterministic suite verifies scenario structure plus the structural
invariants implemented by `tools/test-fixtures.mjs` and
`tools/test-templates.mjs`. Invariant sentences without an executable assertion
are specifications. Actual LLM runs are manual and recorded under
`tests/evals/`.

## Definition of done

- Requested contract and guide are aligned.
- Catalog/schema/adapter/fixture/template/release checks pass.
- Full diff is reviewed for accidental permission expansion.
- `ASSESS` remains R0 and default.
- Unsafe actions remain gated or manual-only.
- New support claims have current observed evidence.
- Changed links and license mapping validate.
- The report states what was not run on Cursor, Claude Code, Copilot, or other
  real hosts.
- Work remains uncommitted unless the user explicitly requested a commit.

## Release preparation

```bash
pnpm release:pack
```

This creates the ignored release directory, deterministic `.tar`, and checksum
sidecar under `dist/`. A `WORKTREE` build is explicitly non-publishable. The
command does not commit, push, tag, sign, or publish; those are separate
human-authorized operations.
