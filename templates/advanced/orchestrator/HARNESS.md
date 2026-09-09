<!-- harnessly:owned workflow=build-local-harness version=0.1.0 -->
# Harness — {{WORKSPACE_NAME}} orchestrator

## Cross-project verification

{{PROJECT_SENSORS}}

Run only sensors for affected projects. A cross-project change is complete when
all affected project checks pass and the orchestrator registry remains valid.

## Registry checks

- Every project path is relative.
- Every path resolves to the intended root.
- No path points inside another registered project's generated/dependency tree.
- Embedded topology registers the host project as `..`.
- Parent-hub topology registers only selected siblings.
- Every entrypoint and harness resolves inside its registered project.
- Every project has at least one high-confidence routing signal.
- Sensor references match the selected project's current harness before use.

## Definition of done

- Review diffs separately in each Git repository.
- Confirm no source was copied into `orchestrator/`.
- Run affected project sensors.
- Test one unambiguous routing example for every registered project.
- Validate links and `projects.yaml`.
- State `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`, and `N/A`.
- Do not commit or push.
