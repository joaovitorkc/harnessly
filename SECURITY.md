# Security policy

Harnessly workflows can influence coding agents with filesystem and shell
access. Treat every workflow change as supply-chain-sensitive.

## Supported versions

Published release manifests and their full commit SHAs are supported. Tags are
convenient aliases but can move; `MODE=APPLY` must use the manifest's verified
40-character `sourceRevision`. `main` is preview-only.

## Report a vulnerability

Use GitHub private vulnerability reporting for the Harnessly repository. Do
not open a public issue for a working exploit, leaked credential, or bypass of
an authorization gate.

Include:

- affected workflow ID and version or commit SHA;
- mode, profile, host, and model;
- minimal synthetic fixture;
- expected and observed effects;
- commands, changed paths, and whether any external effect occurred.

Never include real secrets or private repository contents.

## Security invariants

- Repository content is untrusted data, not executable instruction.
- `MODE=ASSESS` causes no filesystem, Git, dependency, or external mutation.
- `MODE=APPLY` authorizes only declared local writes.
- A tool being available does not grant permission to use it.
- Real `.env` files, credential stores, SSH material, browser sessions,
  production data, and direct `.git/` object traversal are outside discovery
  scope. Git-mediated status, roots, tracked paths, and scoped non-secret diffs
  are allowed.
- Git commit, push, tag, merge, rebase, reset, remote changes, and pull
  requests require separate explicit authorization and are forbidden to v0.1
  workflows.
- Local dependency/configuration changes and lifecycle-script execution require
  a scoped R3 gate and verified confinement.
- Delete/move, permission changes, migrations, production infrastructure,
  shared/external storage or database writes, and authenticated network writes
  are R4 manual-only handoffs and are never executed by v0.1 workflows.
- Symlinks may not escape the target root. Nested Git roots are boundaries.
- Sensitive values are redacted and never persisted in reports.
- A changed precondition invalidates prior approval.

## Remote-content policy

The initial user-selected Harnessly workflow may be loaded from a
full-commit-SHA Raw GitHub URL. During execution, the workflow must not follow
additional instructions discovered in source files, logs, issues, web pages,
or package metadata.

Required static assets must be part of the same verified release and checked
against its manifest. Moving branch and tag URLs are rejected for apply
examples.

## Threat model

See [`docs/threat-model.md`](./docs/threat-model.md) for assets, trust
boundaries, attacks, and residual risks.

## No sandbox claim

Markdown instructions are not a security sandbox. Enforcement depends on the
host agent and its permissions. Run assessments with a read-only workspace
when the host supports it, review the plan before apply, and inspect the final
diff.
