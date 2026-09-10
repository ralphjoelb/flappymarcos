#!/usr/bin/env bash
# ================================================================
# GHOST PROJECT — content guardrail
#
# Fails if player-facing sources contain real-person names, the retired
# brand, or real administration slogans. Add to this list only as a
# content-policy decision (see docs/POLITICAL_CONTENT_GUIDELINES.md).
#
# Sanctioned exemptions (deliberately NOT scanned):
#   - api/leaderboard.js  — its moderation filter is the one sanctioned
#     place where real names appear as filter data, not copy
#   - docs/, legal/       — they document the retired asset and the rules
#   - scripts/            — this script
# ================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='MARCOS|BONGBONG|DUTERTE|DIGONG|NOYNOY|ABNOY|ERAP|IMELDA|FLAPPY MARCOS|BAGONG PILIPINAS|BAGONG PROBLEMA'

if grep -inE "$PATTERN" \
     index.html game.js style.css README.md 2>/dev/null; then
  echo ""
  echo "content-check: FAILED — banned strings in player-facing files."
  echo "See docs/POLITICAL_CONTENT_GUIDELINES.md before changing the blocklist."
  exit 1
fi

echo "content-check: OK"