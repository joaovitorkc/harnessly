# HLY-001 — Set up an agent-ready workspace

Executable: [`../../prompts/setup-workspace/PROMPT.md`](../../prompts/setup-workspace/PROMPT.md)
Manifest: [`../../prompts/setup-workspace/manifest.yaml`](../../prompts/setup-workspace/manifest.yaml)

## Fast path

Open the workflow in your coding agent and say:

```text
Analyze this project and show me the setup you recommend. Do not change anything yet.
```

If the plan looks right, reply in the same chat:

```text
Apply the plan you just showed me. Verify the result and tell me what you could not check.
```

That is enough for the normal setup. The parameters below are optional controls
for automation or a less common layout.

## Use it when

- adopting coding agents in an existing repository;
- standardizing a monorepo without flattening package differences;
- creating a documentation/harness control plane for several repos;
- auditing an earlier AI setup before adding more files.

Do not use it to initialize an empty application, migrate repositories, install
a framework, or replace a team's existing engineering process wholesale.

## Optional controls

- `MODE`: `ASSESS` or `APPLY`; default `ASSESS`.
- `PROFILE`: `STANDARD` or `ADVANCED`; default `STANDARD`.
- `TOPOLOGY`: `AUTO`, `REPO_ROOT`, `EMBEDDED`, or `PARENT_HUB`.
- `TARGET_ROOT`: authorized discovery root.
- `TARGET_AGENTS`: optional host adapter list.
- `DOCS_LANGUAGE`: `AUTO`, `EN`, or `PT_BR`.

## Standard output

The standard profile keeps the portable entrypoint and applicable docs close
to the code. It may create root and package-scoped instructions, design docs,
local harness docs, task/decision memory, and a canonical verification path.

It should create fewer files for a static site than for a polyglot monorepo.

## Advanced output

Embedded:

```text
repo/
├── existing product code
└── orchestrator/
    ├── AGENTS.md
    ├── DESIGN.md
    ├── HARNESS.md
    ├── projects.yaml   # path: ..
    └── docs/
```

Parent hub:

```text
workspace/
├── orchestrator/
├── frontend/
└── backend/
```

The repos remain where they are. A copied repo is a second source of truth and
is explicitly forbidden.

## Examples

Start read-only:

```text
Follow HLY-001 with MODE=ASSESS PROFILE=STANDARD.
```

After reviewing the exact plan:

```text
Follow HLY-001 with MODE=APPLY PROFILE=STANDARD TARGET_AGENTS=CURSOR,CLAUDE_CODE.
```

Create an embedded control plane:

```text
Follow HLY-001 with MODE=APPLY PROFILE=ADVANCED TOPOLOGY=EMBEDDED.
```

## Expected verification

- no source copied or moved;
- links and structured files parse;
- project registry resolves;
- final diff stays within declared paths;
- second deterministic merge is empty;
- unsafe project checks remain visibly `NOT_RUN`.

## Limitations

The workflow can write native adapter files but cannot guarantee equal
instruction precedence or model behavior across hosts. It will not install
plugins, authenticate services, or modify Git.
