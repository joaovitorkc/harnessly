# Learned rules

Short durable corrections only:

- ❌ Use decorative “AI-looking” artwork as the README identity -> ✅ prefer
  restrained native GitHub typography, a clear product statement, and
  `What is Harnessly?` before technical detail.
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
