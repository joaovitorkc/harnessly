# HLY-009 — Harden owned HTTP ingress with rate limits

Executable: [`../../prompts/harden-http-rate-limits/PROMPT.md`](../../prompts/harden-http-rate-limits/PROMPT.md)
Manifest: [`../../prompts/harden-http-rate-limits/manifest.yaml`](../../prompts/harden-http-rate-limits/manifest.yaml)

## Use it when

The project owns a server-side HTTP ingress and needs abuse/volume protection
with framework-native implementation and focused tests.

## Applicability gate

Static landing pages, client-only apps, docs, libraries, and external API
consumers return `N/A` without writes. A landing's own form endpoint can be
assessed, but the page/assets remain excluded.

## Decisions required

- endpoint classes and policy numbers;
- stable key strategy;
- direct/proxy trust and hop configuration;
- one-process versus multi-instance deployment;
- memory versus an already existing shared store;
- store failure mode;
- exemptions, response envelope, headers, logs, and metrics.

The workflow does not provision Redis, WAF, CDN, or production configuration.
It also does not connect to an existing shared store; focused tests use
in-process fakes and leave multi-instance integration as a manual handoff.

## Example

```text
Follow HLY-009 with MODE=ASSESS ENDPOINT_CLASSES=auth,expensive
STORE=AUTO TRUST_PROXY=DETECT.
```

## Done when

Focused tests prove below/above limit, `429`, reset, key isolation, forwarded
address trust, exemptions, and fake-store failure. Multi-instance protection
is not claimed; live shared-store coordination remains `NOT_RUN`.
