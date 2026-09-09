# Agent-host compatibility

Harnessly separates portable semantics from host discovery.

## Portable baseline

Every supported host must be able to:

- receive plain Markdown by paste or local file;
- inspect a selected repository;
- report evidence and uncertainty;
- honor read-only versus local-write instructions;
- run project checks when authorized.

URL fetching is optional. A host without it uses copied/downloaded
`PROMPT.md`.

## Repository instructions

`AGENTS.md` is the canonical persistent entrypoint. It is plain Markdown and
supports hierarchical placement across major coding-agent tools.

## Agent Skills

Canonical skills live in `.agents/skills/` and follow the open Agent Skills
specification.

- Cursor discovers `.agents/skills/` and `.cursor/skills/`.
- GitHub Copilot supports `.agents/skills/`, `.github/skills/`, and selected
  compatible locations.
- Claude Code natively discovers `.claude/skills/`; Harnessly generates
  adapters from `.agents/skills/`.

Optional fields such as tool allowlists may be advisory or unsupported. They
never replace the Harnessly risk contract.

## Native adapters

### Cursor

- `AGENTS.md` for portable hierarchy.
- `.cursor/rules/*.mdc` for path/relevance scoping.
- `.agents/skills/` for reusable workflows.

### Claude Code

- concise `CLAUDE.md` importing or pointing to portable context;
- generated `.claude/skills/`;
- generated `.claude/agents/` for specialist roles when justified.

### GitHub Copilot

- `AGENTS.md`;
- `.github/copilot-instructions.md`;
- `.agents/skills/`;
- `.github/prompts/*.prompt.md` and `.github/agents/` only on supporting
  surfaces.

## Evidence states

| State | Meaning |
|-------|---------|
| `not-run` | No current execution evidence |
| `observed-pass` | Declared scenario passed on the recorded host/model |
| `partial` | Some invariants passed or a host feature was unavailable |
| `observed-fail` | A hard or expected invariant failed |
| `stale` | Prompt or fixture digest changed, or host evidence expired |

Harnessly v0.1 starts conservative. Documentation compatibility does not become
`observed-pass` until a real run record exists.

## Current evidence

| Host | Documented discovery surface | Workflow observation |
|------|------------------------------|----------------------|
| Cursor | `AGENTS.md`, `.cursor/rules/`, `.agents/skills/` | [`not-run`](../tests/evals/cursor-setup-standard.yaml) |
| Claude Code | `CLAUDE.md`, `.claude/skills/`, `.claude/agents/` | [`not-run`](../tests/evals/claude-advanced-embedded.yaml) |
| GitHub Copilot | `AGENTS.md`, repository instructions, Agent Skills, supported agents/prompts | [`not-run`](../tests/evals/copilot-rate-limit-na.yaml) |
| Generic Markdown-capable agent | Pasted or local `PROMPT.md` | `not-run` |

“Documented discovery surface” means the vendor/open specification describes
the file location. It does not mean a Harnessly workflow has passed there.

## Known limitations

- Hosts resolve nested instruction precedence differently.
- Models may not follow Markdown safety boundaries reliably.
- Some Copilot prompt/agent features vary by surface.
- URL/network access varies by host and policy.
- Tool names and permission enforcement are host-specific.

The Raw URL experience is a convenience, not a claim that every conversational
AI can modify a local repository.
