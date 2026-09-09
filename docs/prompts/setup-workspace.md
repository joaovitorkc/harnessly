# HLY-001 — Set up an agent-ready workspace

Executable: [`../../prompts/setup-workspace/PROMPT.md`](../../prompts/setup-workspace/PROMPT.md)
Manifest: [`../../prompts/setup-workspace/manifest.yaml`](../../prompts/setup-workspace/manifest.yaml)

## Fast path

Open the workflow in your coding agent and say:

```text
Analyze this project and show me the complete internal setup: instructions, design, skills, sensors, and everything else that applies. Do not change anything yet.
```

If the plan looks right, reply in the same chat:

```text
Apply the plan you just showed me. Verify the result and tell me what you could not check.
```

That is enough for the complete normal setup. The parameters below are optional
controls for automation or a less common layout.

## Use it when

- adopting coding agents in an existing repository;
- standardizing a monorepo without flattening package differences;
- creating a documentation/harness control plane for several repos;
- auditing an earlier AI setup before adding more files.

Do not use it to initialize an empty application, migrate repositories, install
a framework, or replace a team's existing engineering process wholesale.

## Optional controls

- `MODE`: `ASSESS` or `APPLY`; default `ASSESS`.
- `SETUP_DEPTH`: `COMPLETE` or `FOUNDATION`; default `COMPLETE`.
- `PROFILE`: `STANDARD` or `ADVANCED`; default `STANDARD`.
- `TOPOLOGY`: `AUTO`, `REPO_ROOT`, `EMBEDDED`, or `PARENT_HUB`.
- `TARGET_ROOT`: authorized discovery root.
- `TARGET_AGENTS`: optional host adapter list.
- `DOCS_LANGUAGE`: `AUTO`, `EN`, or `PT_BR`.

## Standard output

The standard profile configures the repository where the agent is running. It
keeps portable entrypoints and package-specific guidance close to the code and
completes every applicable setup stage.

It should create fewer files for a static site than for a polyglot monorepo.

## Orchestrator output

The Advanced profile creates a central Orchestrator. Start the agent there with
a problem; it matches the request to one registered project, loads that
project's `AGENTS.md` and `HARNESS.md`, performs work in that repository, and
uses its sensor for verification.

The control plane stores routing, project references, cross-project plans, and
shared decisions. It does not copy project code or run as a background
service.

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

## What complete setup means

One self-contained HLY-001 prompt composes the focused workflows in dependency
order:

1. project inventory;
2. agent instructions, skills, rules, and adapters;
3. evidence-backed system design and configuration docs;
4. local harness, journeys, sensors, and quality gates;
5. CI, dependency integrity, and HTTP rate limits when applicable;
6. a final reproducible readiness grade.

Each stage remains independently `APPLIED`, `N/A`, `BLOCKED`, or `FAILED`.
Risky dependency, CI, policy, or multi-repository changes pause for one exact
gate in the same chat. A blocked stage prevents a false `READY` result but does
not hide independent safe work.

## Examples

Start read-only:

```text
Follow HLY-001 with MODE=ASSESS PROFILE=STANDARD.
```

After reviewing the exact plan:

```text
Follow HLY-001 with MODE=APPLY SETUP_DEPTH=COMPLETE PROFILE=STANDARD TARGET_AGENTS=CURSOR,CLAUDE_CODE.
```

Create an embedded control plane:

```text
Follow HLY-001 with MODE=APPLY SETUP_DEPTH=COMPLETE PROFILE=ADVANCED TOPOLOGY=EMBEDDED.
```

## Expected verification

- no source copied or moved;
- links and structured files parse;
- project registry resolves;
- routing selects one project and resolves its entrypoint and harness;
- every composed stage has an explicit result;
- the readiness grade recalculates from current evidence;
- final diff stays within declared paths;
- second deterministic merge is empty;
- unsafe project checks remain visibly `NOT_RUN`.

## Limitations

The workflow can write native adapter files but cannot guarantee equal
instruction precedence or model behavior across hosts. It will not install
plugins, authenticate services, modify Git, use production, or turn broad
approval into permission for an undisclosed R3/R4 action.
