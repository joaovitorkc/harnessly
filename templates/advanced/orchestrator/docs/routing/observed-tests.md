<!-- harnessly:owned workflow=setup-workspace version=1.0.0-beta.1 -->
# Routing checks

Each case proves one routing decision from current registry evidence. These
checks do not authorize product writes.

{{ROUTING_TESTS}}

## Required evidence

- request text;
- matched signals and exclusions considered;
- selected project or one focused ambiguity question;
- entrypoint and harness paths with current digests;
- result state: `PASS`, `BLOCKED`, or `FAIL`.

An ambiguous check must not load instructions from multiple projects.
