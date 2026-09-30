@AGENTS.md

Canonical skills live in `.agents/skills/`. Cursor and Claude Code receive
mirrors (`.cursor/skills/` and `.claude/skills/`) via the hub script
`../scripts/sync-claude-skills.sh`. Do not treat the Cursor copy as source.
After changing a canonical skill or agent, also run `pnpm sync:adapters` if
adapters besides these skill trees apply.

