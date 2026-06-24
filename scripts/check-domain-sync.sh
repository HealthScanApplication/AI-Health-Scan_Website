#!/usr/bin/env bash
# Asserts the shared protocol-domain modules are byte-identical between the
# website and the mobile app. Run in CI (or manually) to prevent drift — the
# class of bug where sleep/recurrence logic diverges between the two apps.
set -euo pipefail

WEB="$(cd "$(dirname "$0")/.." && pwd)/src/protocolDomain"
MOB="${MOBILE_REPO:-$HOME/Developer/AI-Health-Scan_Mobile}/src/protocolDomain"

if [ ! -d "$MOB" ]; then
  echo "skip: mobile repo not found at $MOB (set MOBILE_REPO to override)"
  exit 0
fi

if diff -r "$WEB" "$MOB" >/tmp/domain-sync.diff 2>&1; then
  echo "✓ protocolDomain is in sync (web === mobile)"
else
  echo "✗ protocolDomain has DIVERGED between web and mobile:"
  cat /tmp/domain-sync.diff
  exit 1
fi
