# Provenance and original implementation

Harnessly was independently authored for this repository. Its source text,
workflow taxonomy, manifests, templates, tests, and defaults were not copied
from the reference toolkit.

## Public standards used

- [AGENTS.md](https://agents.md/) — vendor-neutral repository instructions.
- [Agent Skills](https://agentskills.io/specification) — portable `SKILL.md`
  package format.
- [Semantic Versioning](https://semver.org/) — public version vocabulary.
- [SPDX](https://spdx.dev/) and [REUSE](https://reuse.software/) — license
  identifiers and file mapping.
- [JSON Schema](https://json-schema.org/) — contract validation.

## Vendor documentation consulted

- [Cursor rules](https://cursor.com/docs/rules)
- [Cursor skills](https://cursor.com/docs/skills)
- [Claude Code project memory](https://code.claude.com/docs/en/claude-md)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [GitHub Copilot customization](https://docs.github.com/en/copilot/reference/customization-cheat-sheet)

Vendor adapters are convenience layers. Their formats can change independently
of the Harnessly contract and must be re-evaluated before support claims are
updated.

## Reference repository boundary

The public `soumatheusgomes/vibe-coding-toolkit` repository was considered only
for the user-stated interaction pattern: discover a Markdown prompt through a
short Raw GitHub instruction. The exact observed revision was not retained, so
this document does not make a forensic clean-room-process claim. Harnessly does
not intentionally include that project's wording, prompt bodies, templates,
rules, code, filenames, or taxonomy.

## Adding third-party material

Do not copy a useful-looking snippet into Harnessly. Before vendoring:

1. identify the canonical source and immutable revision;
2. verify the source license permits redistribution;
3. record path, source, revision, copyright, modifications, and license in
   `NOTICE.md`;
4. isolate it from original Harnessly material;
5. add an integrity test.

No third-party source is vendored in v0.1.
