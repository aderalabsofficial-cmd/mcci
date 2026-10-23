#!/usr/bin/env bash
# Gateway checks G1–G8 (docs/17 §3) against the LOCAL isolated self-hosted stack (127.0.0.1 only).
# Prints test names and pass/fail, never key values. The logic lives in tests/integration/gateway.test.ts.
#   MCCI_SELFHOST_RUNTIME=<dir> scripts/selfhost/gateway-checks.sh
# Staging (TLS proxy, external reachability for G5) needs a separate, explicitly approved procedure.
set -euo pipefail
cd "$(dirname "$0")/../.."
exec scripts/selfhost/with-env.sh env MCCI_IT_SELFHOST=1 \
  pnpm exec vitest run --config vitest.integration.config.ts tests/integration/gateway.test.ts
