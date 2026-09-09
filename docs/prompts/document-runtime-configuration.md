# HLY-007 — Document runtime configuration safely

Executable: [`../../prompts/document-runtime-configuration/PROMPT.md`](../../prompts/document-runtime-configuration/PROMPT.md)
Manifest: [`../../prompts/document-runtime-configuration/manifest.yaml`](../../prompts/document-runtime-configuration/manifest.yaml)

## Use it when

Configuration lives partly in code, examples, CI, and team memory, or when a
frontend/server monorepo needs a clear public-versus-secret boundary.

## Hard boundary

The workflow never opens real `.env` variants, process environments,
credential stores, private deployment state, or untracked config. It discovers
key names from tracked source, schemas, examples, and CI declarations.

## Outputs

- key name, source, consumer, type, requirement condition, and sensitivity;
- safe placeholder category;
- missing/stale documentation and example coverage;
- sanitized example files when safe;
- existing validator integration only, with no new dependency.

## Static sites

A static site can still have public build variables. Server-only credential
sections become `N/A`.

## Example

```text
Follow HLY-007 with MODE=ASSESS VALIDATION=DOCUMENT
CREATE_EXAMPLES=true.
```

## Done when

Every documented key cites source, examples contain no operational value,
public/server scope is explicit, ignored secret patterns preserve examples,
and real secret files remain unread and unchanged.
