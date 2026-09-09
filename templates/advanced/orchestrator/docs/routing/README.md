<!-- harnessly:owned workflow=setup-workspace version=1.0.0-beta.1 -->
# Workspace routing

Map user language and technical signals to exactly one registered project
before loading product-specific instructions.

`projects.md` is the human routing map. `../../projects.yaml` is its
machine-readable source.

For each project keep:

- names and unambiguous signals;
- common confusions and explicit exclusions;
- canonical entrypoint;
- local sensor;
- operations that require a human gate.

If the target remains ambiguous after reading the registry, ask one focused
question. Do not load unrelated project context. Once selected, read that
project's entrypoint and harness before editing source.

Record routing checks in `observed-tests.md`: request, matched signals,
exclusions, selected project or question, entrypoint/harness digests, and
result state. If the registry sensor and project harness disagree, the harness
wins and the routing record is stale until refreshed.
