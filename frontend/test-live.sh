#!/usr/bin/env bash
# Voltherm — local end-to-end test against REAL FortyGuard + Groq keys.
# Run this from the backend/ folder after filling in .env.
#
# Usage:
#   chmod +x test-live.sh
#   ./test-live.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:4000}"

echo "== 0. Checking .env has real keys set =="
if [ ! -f .env ]; then
  echo "❌ No .env file found. Run: cp .env.example .env, then fill in your keys."
  exit 1
fi

source .env
MISSING=()
[ -z "$GROQ_API_KEY" ] && MISSING+=("GROQ_API_KEY")
[ -z "$FORTYGUARD_API_KEY" ] && [ -z "$FORTYGUARD_API_KEY_HEAT" ] && MISSING+=("FORTYGUARD_API_KEY (or FORTYGUARD_API_KEY_HEAT)")

if [ ${#MISSING[@]} -ne 0 ]; then
  echo "⚠️  Missing keys: ${MISSING[*]}"
  echo "   The pipeline will still run but will fall back to mock/degraded results."
  echo "   Press Ctrl+C to stop and fill in .env, or wait 3s to continue anyway."
  sleep 3
fi

echo ""
echo "== 1. Health check =="
curl -s "$BASE_URL/api/health"
echo ""

echo ""
echo "== 2. Cold request — first hit for this site (expect source: live) =="
RESP1=$(curl -s -X POST "$BASE_URL/api/screen-site" \
  -H 'Content-Type: application/json' \
  -d '{"lat":33.44,"lng":-94.04}')
echo "$RESP1" | python3 -m json.tool 2>/dev/null || echo "$RESP1"

VERDICT1=$(echo "$RESP1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verdict'))" 2>/dev/null)
SOURCES1=$(echo "$RESP1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sources'))" 2>/dev/null)
echo ""
echo "  verdict: $VERDICT1"
echo "  sources: $SOURCES1"
echo "  -> check sources.* say 'live' (not 'mock'), verdict is PASS"

echo ""
echo "== 3. Repeat same coordinates — should hit cache =="
RESP2=$(curl -s -X POST "$BASE_URL/api/screen-site" \
  -H 'Content-Type: application/json' \
  -d '{"lat":33.44,"lng":-94.04}')
SOURCES2=$(echo "$RESP2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sources'))" 2>/dev/null)
LATENCY2=$(echo "$RESP2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('latency_ms'))" 2>/dev/null)
echo "  sources: $SOURCES2"
echo "  latency_ms: $LATENCY2"
echo "  -> check sources.* now say 'cache', latency should be much lower than request #2"

echo ""
echo "== 4. Different site — forces fresh live calls =="
RESP3=$(curl -s -X POST "$BASE_URL/api/screen-site" \
  -H 'Content-Type: application/json' \
  -d '{"lat":29.76,"lng":-95.37}')
echo "$RESP3" | python3 -m json.tool 2>/dev/null || echo "$RESP3"

echo ""
echo "== 5. Invalid input — should 400 =="
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST "$BASE_URL/api/screen-site" \
  -H 'Content-Type: application/json' \
  -d '{"lat":33.44}'

echo ""
echo "== Done. Review the sources/verdict fields above against README.md's checklist. =="
