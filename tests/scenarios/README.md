# Workflow scenario specifications

Each YAML file states applicability, allowed write boundaries, and behavioral
invariants for one workflow.

`pnpm validate` proves schema, catalog/fixture references, unique case IDs,
empty writes for `ASSESS`/`N/A`/`BLOCKED`, and overlap with manifest-declared
paths. `pnpm test:fixtures` and `pnpm test:templates` execute the structural
assertions implemented in those tools.

Other invariant sentences are specifications for a real agent-host evaluation.
They do not become passing tests merely because the YAML validates. Record an
observed run under `tests/evals/` with prompt and fixture digests.
