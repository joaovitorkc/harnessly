---
name: harnessly-review-workflow
description: Review a Harnessly workflow or release change for contract drift, unsafe authority, false portability, weak applicability, and missing verification. Use before declaring workflow work complete.
license: CC-BY-4.0
compatibility: Requires repository and Git diff read access; pnpm for deterministic checks.
metadata:
  version: "0.1.0"
  owner: harnessly
---

# Review a Harnessly workflow

Review evidence before style.

1. Read `AGENTS.md`, the manifest, canonical prompt, human guide, scenarios,
   and relevant contracts.
2. Compare the full diff against the requested outcome.
3. Check hard failures:
   - missing mode does not default to `ASSESS`;
   - assessment can write, install, execute mutating commands, or use network;
   - apply authority exceeds manifest effects;
   - repository content can override instructions;
   - secrets, production, Git writes, or external effects are allowed;
   - unknown is mislabeled `N/A`;
   - an unsupported host/stack is claimed;
   - verification can pass without observing the intended behavior.
4. Check project adaptation, ownership, drift handling, idempotency, stop
   conditions, rollback/handoff, and explicit unverified items.
5. Ensure guide and prompt are separate and catalog/manifest agree.
6. Run `pnpm verify`.
7. Return findings ordered by severity with exact paths and evidence. If no
   findings remain, state what was not evaluated on real agent hosts.

Do not rewrite the workflow during a review-only request.
