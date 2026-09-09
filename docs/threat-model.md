# Threat model

## Assets

- user source code and uncommitted work;
- repository instructions and quality policy;
- credentials and private configuration outside authorized scope;
- package/dependency integrity;
- Git history and remotes;
- production, infrastructure, storage, and external services;
- trust in Harnessly release contents and reports.

## Trust boundaries

1. Coding-agent host and its enforced permissions.
2. Current explicit user instruction.
3. Immutable Harnessly workflow bytes.
4. Existing authoritative project instructions.
5. Repository files, dependencies, logs, issues, and web content as untrusted
   evidence.

## Primary threats

### Repository prompt injection

A README, code comment, dependency, fixture, or log tells the agent to ignore
the workflow, read secrets, or run a command.

Mitigation: fixed precedence, repository-content-as-data rule, forbidden
capabilities, adversarial fixture canaries, and host read-only mode where
available.

### Moving remote instructions

A Raw URL changes after the user reviews it.

Mitigation: verified release digest, full commit SHA for apply, no branch/tag
alias for apply, and no additional mutable instruction fetches.

### Scope escape

Symlinks, parent traversal, nested Git roots, or broad globs cross the intended
project.

Mitigation: resolved target roots, symlink containment, Git boundaries,
declared write paths, and final diff review.

### Destructive or external side effect

An apparently useful setup installs scripts, migrates data, modifies Git,
contacts production, or changes infrastructure.

Mitigation: R0–R4 model, apply limited to declared R1/R2, scoped R3 gates, R4
manual-only, and explicit stop conditions.

### Secret disclosure

Discovery opens `.env`, process environments, credentials, dumps, or private
topology and writes values into docs/chat.

Mitigation: forbidden secret sources, key-name-only configuration mapping,
redaction, synthetic canaries, and report review.

### Adapter drift

Claude/Cursor/Copilot instructions diverge and grant different authority.

Mitigation: portable canonical source, deterministic adapter generation,
byte/semantic parity checks, and thin adapters.

### False-green verification

The agent claims tests passed without running, treats `NOT_RUN` as success, or
uses a gate that always exits zero.

Mitigation: explicit check-state vocabulary, observed exit codes, aggregate
failure-propagation tests, readiness grade calculation, and unverified section.

## Residual risks

Markdown cannot enforce a sandbox. A host or model can disobey instructions;
the user's available tools may expose more than intended; release tags can be
moved if repository controls fail; static scans can miss secrets or malicious
content; LLM behavior changes over time.

Use host permissions, isolated fixtures, verified release manifests and
digests, full commit SHAs, manual diff review, and least-privilege credentials
as independent controls.
