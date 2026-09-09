<!-- harnessly:owned workflow=build-local-harness version=0.1.0 -->
# Harness — {{PROJECT_NAME}}

## Prerequisites

{{PREREQUISITES}}

## Canonical sensor

```bash
{{VERIFY_COMMAND}}
```

## Local start

{{LOCAL_START}}

## Golden journeys

{{GOLDEN_JOURNEYS}}

## Definition of done

- Review the full diff against the request.
- Run every cheap applicable check.
- Exercise the changed path at the appropriate level.
- Preserve unrelated changes.
- Report `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`, and `N/A` honestly.
- State residual risks and what was not verified.

## Unsafe or manual-only actions

{{MANUAL_GATES}}
