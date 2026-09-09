# Learned rules

Short durable corrections only:

- ❌ Treat a package-manager `--offline` flag as launcher isolation -> ✅
  preflight Corepack, set `COREPACK_ENABLE_NETWORK=0`, and block an uncached
  manager.
- ❌ Say “orchestrator folder” without explaining the desk -> ✅ Normal
  sets up the folder you opened; Orchestrator is the place you send a
  problem so it picks the project and uses that project's harness.
- ❌ Advertise one-prompt setup while leaving applicable harness stages for
  manual follow-up -> ✅ the setup entrypoint must complete every safe,
  applicable internal stage or report exactly why it stopped.
- ❌ Leave the README identity as a plain `# Harnessly` heading -> ✅ use a
  dual-theme wordmark banner; keep it typographic, not illustrated AI art.
- ❌ Start with tag/SHA placeholders and contract jargon -> ✅ give users one
  ready-to-copy assessment command, then let them approve in plain language in
  the same chat.
- Copying a project into an embedded orchestrator creates two sources of truth
  -> register the existing root by relative path and never copy/move code.
- “Works with any AI” is not verifiable -> state the portable baseline and
  label host/model runs as observed evidence.
- Branches and tags can move after review -> require the verified full commit
  SHA for apply.
- Profile and authority answer different questions -> keep `PROFILE` and
  `MODE` independent.
- A missing server does not mean a failed rate-limit setup -> return justified
  `N/A` for static/client-only projects.
