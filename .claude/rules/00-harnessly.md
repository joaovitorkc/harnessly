> GERADO por scripts/sync-claude-rules.py. Fonte: `harnessly/.cursor/rules/00-harnessly.mdc`. Não editar — mude o `.mdc` e rode `./scripts/sync-claude-rules.sh`.


# Harnessly

Harnessly is a Markdown-first workflow library, not an agent runtime or SaaS
application.

Read `AGENTS.md`, `DESIGN.md`, and `HARNESS.md`. Canonical workflow behavior
lives in `contracts/v1/`, `catalog.yaml`, and `prompts/`.

Use `.agents/skills/` as the portable skill source. Files under `.claude/` and
`.github/agents/` are generated adapters.

Run `pnpm verify`, review the full diff, and state which real hosts were not
evaluated. Never commit or push without a current explicit request.
