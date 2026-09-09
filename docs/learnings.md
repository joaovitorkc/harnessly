# Learned rules

Short durable corrections only:

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
