# HLY-004 — Document system design from repository evidence

Executable: [`../../prompts/document-system-design/PROMPT.md`](../../prompts/document-system-design/PROMPT.md)
Manifest: [`../../prompts/document-system-design/manifest.yaml`](../../prompts/document-system-design/manifest.yaml)

## Use it when

Architecture knowledge is implicit in code, outdated docs, or one person's
memory. Run the inventory workflow first for mixed or unfamiliar repositories.

## Output depth

- `BASELINE`: one concise `DESIGN.md`.
- `DEEP`: an index plus focused system context, component/boundary,
  runtime/data-flow, interface, deployment, and decision pages.
- `AUTO`: deep output only when the system shape justifies it.

## Evidence vocabulary

The workflow distinguishes facts, inferences, explicit decisions, and
unknowns. Folder names are not enough to prove a runtime role. Sensitive
topology is named abstractly, without real values.

## Example

```text
Follow HLY-004 with MODE=ASSESS DEPTH=AUTO FOCUS=auth,billing.
```

## Done when

Paths exist, relationships have evidence, Mermaid matches prose, unknowns are
visible, existing ADRs are not contradicted silently, local links resolve, and
no secret or private topology value appears in the diff.
