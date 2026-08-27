# Voltherm backend

## Setup
```bash
cp .env.example .env   # fill in FORTYGUARD keys + GROQ_API_KEY
npm install
npm run dev
```
Server runs on `:4000` (or `$PORT`).

## Current API contract

### POST /api/screen-site
Request body:
```json
{
  "lat": 33.44,
  "lng": -94.04,
  "address": "Dallas, TX",
  "polygon_aoi": [
    { "lat": 33.44, "lng": -94.04 },
    { "lat": 33.45, "lng": -94.04 },
    { "lat": 33.45, "lng": -94.05 },
    { "lat": 33.44, "lng": -94.05 }
  ]
}
```
- `lat` and `lng` are required numbers.
- `address` is optional.
- `polygon_aoi` is optional and only used for heatmap generation.

Response shape (successful pass):
```json
{
  "location": { "lat": 33.44, "lng": -94.04, "address": "Dallas, TX" },
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

### POST /api/screen-sites
Request body:
```json
{
  "lats": [41.8781, 40.7128, 37.7749],
  "lngs": [-87.6298, -74.006, -122.4194],
  "addresses": ["Chicago, IL", "New York, NY", "San Francisco, CA"],
  "count": 3
}
```
- `lats` and `lngs` are required arrays of numbers.
- `addresses` is optional but should match the same length when supplied.
- `count` is optional, but if present it must equal `lats.length`.

Response shape:
```json
{
  "sites": [
    {
      "rank": 1,
      "location": { "lat": 41.8781, "lng": -87.6298, "address": "Chicago, IL" },
      "tss_score": 72,
      "risk_level": "Low",
      "breakdown": { "heat_penalty": 20, "shade_penalty": 10, "environmental_penalty": 15 },
      "recommendation": "...",
      "roi_text": "...",
      "verdict": "PASS",
      "partial_data": false,
      "coherence_notes": [],
      "sources": { "heat": "live", "shade": {"satellite":"live","street_view":"cache"}, "financial": "cache" },
      "latency_ms": 5000
    }
  ],
  "best_location": { "lat": 41.8781, "lng": -87.6298, "address": "Chicago, IL" },
  "summary": "...",
  "total_sites": 3,
  "latency_ms": 9400
}
```
`summary` may be `null` if the portfolio-level Groq summary fails or rate limits.

## No API keys yet?
Works out of the box with **no FortyGuard key and no Groq key**:
- FortyGuard calls fail → cache miss → static mock data (`src/lib/mockData.js`) is used, `sources.*` will read `"mock"`.
- Groq calls fail → `recommendation_unavailable: true`, verdict `FAIL`, score still returned.

This lets you build/demo the deterministic core (validation + TSS) before either API key exists.

## Test it
```bash
# health check
curl.exe http://localhost:4000/api/health

# single site analysis
curl.exe -X POST http://localhost:4000/api/screen-site -H "Content-Type: application/json" -d "{\"lat\":33.44,\"lng\":-94.04,\"address\":\"Dallas, TX\"}"

# multi-site ranked portfolio check
curl.exe -X POST http://localhost:4000/api/screen-sites -H "Content-Type: application/json" -d "{\"lats\":[41.8781,40.7128,37.7749],\"lngs\":[-87.6298,-74.006,-122.4194],\"addresses\":[\"Chicago, IL\",\"New York, NY\",\"San Francisco, CA\"],\"count\":3}"
```

## Shade fallback mock locations
These verified U.S. points are used as deterministic Shade fallbacks when the live FortyGuard job stalls or fails:

```json
{
  "chicago": { "lat": 41.846328, "lng": -87.743296, "satellite": {"canopy_pct": 24, "pavement_pct": 58, "building_pct": 18}, "street_view": {"ground_level_shade_pct": 20} },
  "newYork": { "lat": 40.7128, "lng": -74.006, "satellite": {"canopy_pct": 18, "pavement_pct": 62, "building_pct": 20}, "street_view": {"ground_level_shade_pct": 6.48} },
  "sanFrancisco": { "lat": 37.7749, "lng": -122.4194, "satellite": {"canopy_pct": 31, "pavement_pct": 49, "building_pct": 20}, "street_view": {"ground_level_shade_pct": 14} },
  "austin": { "lat": 30.2672, "lng": -97.7431, "satellite": {"canopy_pct": 36, "pavement_pct": 44, "building_pct": 20}, "street_view": {"ground_level_shade_pct": 28} },
  "seattle": { "lat": 47.6062, "lng": -122.3321, "satellite": {"canopy_pct": 45, "pavement_pct": 35, "building_pct": 20}, "street_view": {"ground_level_shade_pct": 39} }
}
```

Example curl for the Chicago fallback request:
```bash
curl.exe -X POST https://api.fortyguard.com/v1/satellite -H "Content-Type: application/json" -H "api-key: YOUR_SHADE_KEY" -d "{\"sat\":{\"latitude\":41.846328,\"longitude\":-87.743296},\"date_time\":{\"start_date\":\"2024-07-15\",\"start_time\":\"14:00\",\"filter_type\":1},\"granularity\":80}"

curl.exe -X POST https://api.fortyguard.com/v1/streetview -H "Content-Type: application/json" -H "api-key: YOUR_SHADE_KEY" -d "{\"latitude\":40.7128,\"longitude\":-74.0060,\"vertical_angle\":10,\"horizontal_angle\":90,\"back_view\":false}"
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
