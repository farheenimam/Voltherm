# Voltherm backend

## Setup
```bash
cp .env.example .env   # fill in FORTYGUARD keys + GROQ_API_KEY
npm install
npm run dev
```
Server runs on `:4000` (or `$PORT`).

## Endpoint
```
POST /api/screen-site
{ "lat": 33.44, "lng": -94.04, "address": "optional" }
```

Response (PASS):
```json
{
  "tss_score": 68,
  "risk_level": "Moderate",
  "breakdown": { "heat_penalty": 30, "shade_penalty": 45, "environmental_penalty": 40,
                 "exceedance_hours": 4.2, "shade_pct": 18, "wet_bulb_c": 26 },
  "recommendation": "...",
  "roi_text": "...",
  "verdict": "PASS",
  "partial_data": false,
  "coherence_notes": [],
  "sources": { "heat": "live", "shade": {"satellite":"live","street_view":"cache"}, "financial": "cache" },
  "latency_ms": 6120
}
```
On critique failure after one revision: `verdict: "FAIL_AFTER_REVISION"`, `recommendation: null`, raw score still returned.

## No API keys yet?
Works out of the box with **no FortyGuard key and no Groq key**:
- FortyGuard calls fail → cache miss → static mock data (`src/lib/mockData.js`) is used, `sources.*` will read `"mock"`.
- Groq calls fail → `recommendation_unavailable: true`, verdict `FAIL`, score still returned.

This lets you build/demo the deterministic core (validation + TSS) before either API key exists.

## Test it
```bash
curl -X POST localhost:4000/api/screen-site \
  -H 'Content-Type: application/json' \
  -d '{"lat":33.44,"lng":-94.04}'
```

## Architecture notes
- **Employee agents** (`src/agents/heatAgent.js`, `shadeAgent.js`, `financialAgent.js`) each call their own FortyGuard endpoint(s), through `services/fortyguardClient.js`, which does: cache lookup → live call → 1 retry (2s backoff) → stale cache (<24h) → static mock. Each agent uses its own `FORTYGUARD_API_KEY_*` env var.
- **Manager** (`src/agents/manager.js`): dispatches the three agents with `Promise.all`, runs deterministic validation (`lib/validators.js`) and TSS scoring (`lib/tssFormula.js`, no LLM), then makes the one Groq call for the recommendation draft.
- **Critique agent** (`src/agents/critiqueAgent.js`): recomputes TSS itself (no LLM, pure function) and checks field completeness (no LLM), then makes **one Groq call** to judge grounding + relevance (these need semantic judgment). **Yes — critique also uses Groq**, it's the second and last LLM call in the pipeline.
- **Route** (`src/routes/screenSite.js`) wires it together with the one bounded revision loop (max 1 retry of the recommendation step only, per spec §3).

## Caching
In-memory TTL cache (`src/services/cache.js`), keyed by rounded lat/lng + agent:
- Fresh cache: 1h TTL, used first on any repeat request for a nearby site.
- Stale fallback: up to 24h old, used if both the live call and its retry fail.
- Swap `cache.js` for Redis later without touching any agent code — same `get/set/getStale` interface.
