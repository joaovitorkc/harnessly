# Versioning and integrity

Harnessly versions three related surfaces:

- repository release, such as `v0.1.0`;
- workflow version in each manifest;
- contract version under `contracts/v1/`.

## Compatibility rules

A workflow major version changes when it:

- expands writes, capabilities, applicability, or risk;
- changes a safe default;
- removes a stop condition or human gate;
- changes result fields incompatibly.

A minor version adds backward-compatible detection, outputs, or checks. A
patch version corrects wording or behavior without widening authority.

Contract versions change independently. In v0.1, `catalog.yaml.contract`
selects one release-wide contract for every listed workflow. Per-workflow
contract ranges are reserved for a future contract revision.

## Raw URLs

Convenient release alias for review and `MODE=ASSESS`:

```text
https://raw.githubusercontent.com/joaovitorkc/harnessly/v0.1.0/prompts/<slug>/PROMPT.md
```

Required Raw entrypoint for `MODE=APPLY`:

```text
https://raw.githubusercontent.com/joaovitorkc/harnessly/<40-character-sha>/prompts/<slug>/PROMPT.md
```

`main` is a preview channel. It may be used to inspect content but is not a
supported source for `MODE=APPLY`. A tag is also a movable Git reference:
resolve it to the release manifest's full `sourceRevision`, verify the
published archive digest, and use that commit SHA for apply.

## Release manifest

`pnpm release:pack` creates:

- a self-contained `dist/<release>/` directory;
- deterministic `dist/harnessly-<release>.tar`;
- `dist/harnessly-<release>.tar.sha256`;
- a normalized catalog and every distributable file;
- `release-manifest.json` with source revision and SHA-256 per file;
- `SHA256SUMS`.

The manifest sets `publishable: false` when built from `WORKTREE`. A release
build must set `SOURCE_REVISION` to the exact 40-character Git `HEAD`; the
builder rejects mismatches, dirty/untracked source, and distributable files not
tracked by that revision. Publishable payload bytes are read from those Git
blobs after byte parity with the checkout is confirmed.

Verify the downloaded archive first:

```bash
sha256sum --check harnessly-<release>.tar.sha256
tar -xf harnessly-<release>.tar
cd harnessly-<release>
```

On macOS, use `shasum -a 256 --check` for the archive checksum.

Then verify every extracted file from its root:

```bash
sha256sum --check SHA256SUMS
```

On macOS:

```bash
shasum -a 256 --check SHA256SUMS
```

Then compare `release-manifest.json.sourceRevision` with the tag's commit.

Publishing, tagging, signing, or pushing is a separate human-authorized action.

## Evidence freshness

An LLM evaluation is tied to workflow digest, fixture digest, host, model, and
date. It becomes `stale` when the workflow bytes change or when a material host
behavior change invalidates the observation.

Repository policy should prevent tag movement, but clients must not treat that
as an immutable guarantee. A digest mismatch is a hard failure, not a warning.
