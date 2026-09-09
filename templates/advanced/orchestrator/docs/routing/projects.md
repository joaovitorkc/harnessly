<!-- harnessly:owned workflow=setup-workspace version=1.0.0-beta.1 -->
# Project routing map

Use this map to select one project before loading its instructions. Evidence
comes from project manifests, names, current docs, and verified harness files.

{{ROUTING_PROJECTS}}

## Routing contract

1. Match the request against roles, signals, and exclusions.
2. Select exactly one project or ask one focused disambiguation question.
3. Resolve the selected project's registered entrypoint and harness.
4. Read both before editing product source.
5. Work and verify inside that project repository.
6. Treat the recorded sensor as a hint until the project harness confirms it.
7. Record the routing decision and entrypoint/harness digests in
   `observed-tests.md`.

Cross-project requests must list every affected Git root before work begins.
