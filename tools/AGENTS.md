# Maintainer-tool instructions

Tools here validate Harnessly; users do not need them to run workflows.

- Use Node.js ESM and standard library where practical.
- Keep output deterministic and sorted.
- Never call an LLM or require credentials in pull-request validation.
- Write only to an explicit output path under `dist/` or `.tmp/`.
- Reject path traversal, symlinks, duplicate IDs, unknown schema fields,
  moving apply URLs, and adapter drift.
- Error messages must include the failing relative path and invariant.
- A static pass proves repository integrity, not future model behavior.
