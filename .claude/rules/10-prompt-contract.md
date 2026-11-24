---
paths:
  - "prompts/**"
  - "docs/prompts/**"
  - catalog.yaml
---
> GERADO por scripts/sync-claude-rules.py. Fonte: `harnessly/.cursor/rules/10-prompt-contract.mdc`. Não editar — mude o `.mdc` e rode `./scripts/sync-claude-rules.sh`.


# Workflow contract

One workflow has `manifest.yaml`, canonical English `PROMPT.md`, a separate
guide, and invariant scenarios.

Preserve the required heading order. Missing `MODE` means `ASSESS`.
`ASSESS` is R0 and read-only. Apply effects may not exceed the manifest.

Distinguish proven absence (`N/A`) from missing evidence (`BLOCKED`). Keep
prompts self-contained and do not fetch mutable remote instructions.

Use structural merge only for parsed data/config. Source and executable config
require a preimage-guarded `source-patch`. Result gates must carry the complete
target/precondition/impact/rollback/verification contract.

Update catalog/version/scenarios together and run `pnpm verify`.
