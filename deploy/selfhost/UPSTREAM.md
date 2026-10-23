# Upstream self-hosted Supabase — provenance

`deploy/selfhost/upstream/` is a **verbatim** copy of the `docker/` folder of the official
[`supabase/supabase`](https://github.com/supabase/supabase) repository at the pinned release below, without the
development-only `dev/` folder, plus upstream's root `LICENSE`. Do not edit these files: every MCCI change lives in
`deploy/selfhost/mcci/` and `scripts/selfhost/`. Machine-readable pin (every file's git blob hash, image digests):
[`UPSTREAM.json`](./UPSTREAM.json).

| Item                | Value                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Release             | `self-hosted/v0.8.3` (2026-10-16; upstream `docker/CHANGELOG.md`)                                                  |
| Tag object          | `2a678bd96864b71b3148cf0dfb0dcd8fc399749a` (annotated) → commit below — verified                                   |
| Commit              | `bc27d2661edd09a5d0b8d76ce33da6d4071a756e` ("chore(self-hosted): update 2026-10-16 - 0.8.3 (#51839)")              |
| `docker/` tree      | `f0cb4e6a71b05cc2160a88a7c86d84e8d096c829` — 62 files vendored, `dev/` (2 files) excluded                          |
| Licence             | Apache-2.0, upstream root `LICENSE` (blob `49ea124025275674563eeff03af0f653ca49fdc0`) copied to `upstream/LICENSE` |
| Vendored / verified | 2026-10-23 with `node scripts/selfhost/sync-upstream.mjs --export` and the default check                           |

## Images (registry index digests, linux/amd64 + linux/arm64, resolved 2026-10-23)

The MCCI override pins each service as `image: <tag>@<digest>`; tags alone are mutable.

| Service   | Image                                    | Digest                                                                    | Used                                                  |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| db        | `supabase/postgres:17.6.1.136`           | `sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00` | yes — same image as the dry runs (docs/17 §2)         |
| api-gw    | `envoyproxy/envoy:v1.39.1`               | `sha256:57e14a549d7bd43c8d3f6d03e8cfa653e037d4b38e133acd9b54f38c524401b4` | yes                                                   |
| auth      | `supabase/gotrue:v2.197.0`               | `sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b` | yes                                                   |
| rest      | `postgrest/postgrest:v14.18`             | `sha256:c7cd7e265a85b05248abf53f4473fcec7e327c282d0bd0cf60f1551996d09fcf` | yes                                                   |
| realtime  | `supabase/realtime:v2.143.3`             | `sha256:768b559241dd234c4e8852c5c0f504e598b80f1df2ad4dd78d5486fbed2f17a2` | yes                                                   |
| storage   | `supabase/storage-api:v1.81.0`           | `sha256:98ffec5d0678803783c30e404c27f4ec65e97efbe014088f2a86b4b8b54b9f54` | yes                                                   |
| studio    | `supabase/studio:2026.10.12-sha-3699278` | `sha256:948770ec467f00e6ae34c35018ef7cb23d7b30eb806b42c2cc0d7bcfdcf8a7a8` | yes (admin only)                                      |
| meta      | `supabase/postgres-meta:v0.100.0`        | `sha256:145325b7e39f8ef4931d6e8cfd3f6f4d655de09d72a2ccc96d9513542c2202bd` | yes (admin only, `/pg/`)                              |
| supavisor | `supabase/supavisor:2.9.13`              | `sha256:07f1a6098ffc04b80263bca4eb5c3e7bd2e03dfd1fc465aa108d7329000a1a4e` | yes (no published ports)                              |
| imgproxy  | `darthsim/imgproxy:v3.31.4`              | `sha256:73c5dda13199745b0d2d00e4149d4a589c5b2e205dbf335ca05eca8276b54712` | no — profile `imgproxy`; image transformation off     |
| functions | `supabase/edge-runtime:v1.77.4`          | `sha256:ad45164b7548bf5820ed7be714789c17ac2865edce79a09cfb4c3756c3d365a8` | no — profile `functions`; no Edge Functions (docs/01) |

Not used: the optional overlays (`docker-compose.{kong,logs,nginx,caddy,s3,rustfs,pgbouncer,pg15,pg17,envoy}.yml`).
Logs/analytics (Logflare + Vector) are only in `docker-compose.logs.yml`, so they are off by default.

## Release notes that matter to MCCI (upstream `docker/CHANGELOG.md`, 0.8.3)

- **Security fixes:** Realtime GHSA-9vjf-j9f7-j42c (forged Postgres Changes events injected through binary broadcasts
  with only the anon key) and Storage GHSA-8rrf-w776-x75g (signed resumable upload URLs could bypass RLS).
- **Known Realtime issue** (supabase/realtime#2289): every 10 minutes Realtime restarts its database connection and
  Postgres Changes made during the few seconds of reconnection are not delivered. Upstream workaround
  `REGION: us-east-1` on the realtime service — applied in `mcci/docker-compose.mcci.yml`. Remove it once a pinned
  release contains the fix.
- Storage v1.81.0 adds one-way migrations: back up before upgrading, never roll back past it.
- Kong is deprecated; Envoy is the default gateway (docs/17 §3).

## MCCI deviation that was reverted

Commit `7eede6d` bind-mounted the runtime directory over the `db` service's `/etc/postgresql-custom`. Upstream
uses the named volume `db-config` there on purpose: Docker seeds a new named volume from the image's files, a bind
mount does not. The override now keeps upstream's named volume (project volume `mcci-selfhost_db-config`, which also
holds the secret `pgsodium_root.key`); see deploy/selfhost/README.md §7.

## Updating the pin

1. `node scripts/selfhost/sync-upstream.mjs --ref self-hosted/vX.Y.Z` — read-only report of upstream changes and of
   any local drift. It never writes into `deploy/selfhost/`.
2. `node scripts/selfhost/sync-upstream.mjs --export <new empty dir>` after editing `UPSTREAM.json`'s tag/commit —
   writes the new tree elsewhere for review; then replace `upstream/` in a dedicated commit, regenerate the file list
   and digests, re-check `mcci/docker-compose.mcci.yml` against the new base, and re-run the full verification
   (deploy/selfhost/README.md) on the isolated stack before staging.

## Committing the vendored tree

This repository has `core.filemode = false` and its own ignore rules, so two steps keep the commit identical to
upstream. Afterwards `node scripts/selfhost/sync-upstream.mjs --offline --require-tracked` must pass: it checks
content, unexpected files, the LICENSE and every mode from the git index (before staging it reports modes as not verified):

- Upstream's `upstream/.gitignore` hides `volumes/snippets/.gitkeep` and `volumes/storage/.gitkeep`, which upstream
  tracks: add them with `git add -f`.
- Restore upstream's executable bit (mode `100755`) with `git update-index --chmod=+x` on: `reset.sh`, `run.sh`,
  `setup.sh`, `update.sh`, `volumes/api/envoy/docker-entrypoint.sh`, `volumes/api/kong-entrypoint.sh`,
  `volumes/db/init/data.sql` (paths under `deploy/selfhost/upstream/`).
- The MCCI scripts `scripts/selfhost/{compose,init-runtime,with-env,db-tests,gateway-checks}.sh` and
  `sync-upstream.mjs` also need `git update-index --chmod=+x` (`lib.sh` is sourced, not executed).
