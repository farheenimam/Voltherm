# Voltherm API — Integration Guide (Frontend ↔ Backend)

For whoever is wiring the frontend to this backend. One endpoint, one job: send a site location, get back a thermal stress score + recommendation.

---

## Base URL
```
http://localhost:4000        (local dev)
```
Set via `VITE_API_BASE_URL` in the frontend `.env` — never call FortyGuard or Groq directly from the frontend.

---

## Endpoint: Screen a site

```
POST /api/screen-site
Content-Type: application/json
```

### Request body
| Field | Type | Required | Notes |
|---|---|---|---|
| `lat` | number | ✅ | Latitude of the site |
| `lng` | number | ✅ | Longitude of the site |
| `address` | string | optional | Display label only, not used in scoring. Geocode addresses to lat/lng on the frontend before calling this endpoint. |

```json
{ "lat": 33.44, "lng": -94.04, "address": "123 Main St, Texarkana, TX" }
```

### Success response (`verdict: "PASS"`)
```json
{
  "tss_score": 68.4,
  "risk_level": "Moderate",
  "breakdown": {
    "heat_penalty": 30,
    "shade_penalty": 45,
    "environmental_penalty": 40,
    "exceedance_hours": 4.2,
    "shade_pct": 18,
    "wet_bulb_c": 26
  },
  "recommendation": "Add a canopy over stalls 1-4...",
  "roi_text": "Cuts derating hours from 180 to 20, saves ~$3,200/year.",
  "verdict": "PASS",
  "partial_data": false,
  "coherence_notes": [],
  "sources": {
    "heat": "live",
    "shade": { "satellite": "live", "street_view": "cache" },
    "financial": "cache"
  },
  "latency_ms": 6120
}
```

### What this example actually means
Reading the numbers above in plain English:
- **`tss_score: 68.4`** — the site scores 68.4 out of 100 on thermal stress. Higher = better (less heat risk).
- **`risk_level: "Moderate"`** — derived from the score. Below 40 = High risk, 40–70 = Moderate, above 70 = Low.
- **`breakdown.heat_penalty: 30`** — of the total penalty dragging the score down from 100, heat contributed 30 points (before weighting).
- **`breakdown.shade_penalty: 45`** — lack of shade contributed 45 points — this is the biggest single driver here, meaning shade/canopy is this site's main weakness.
- **`breakdown.environmental_penalty: 40`** — wet-bulb temp and solar irradiance contributed 40 points.
- **`breakdown.exceedance_hours: 4.2`** — this site spends 4.2 hours/day above the 35°C threshold.
- **`breakdown.shade_pct: 18`** — only 18% ground-level shade coverage over the site.
- **`breakdown.wet_bulb_c: 26`** — measured wet-bulb temperature, a key real-world heat-stress indicator.
- **`recommendation`** — the plain-English fix, generated from the numbers above (e.g. "add a canopy"), fact-checked by the critique agent so every number in it traces back to real data.
- **`roi_text`** — the dollar/time payoff of following that recommendation.
- **`verdict: "PASS"`** — the critique agent verified the recommendation is accurate and complete; safe to show to the end user as-is.
- **`sources`** — tells you where each agent's data came from: `"live"` (fresh FortyGuard call), `"cache"` (reused recent result), or `"mock"` (fallback, FortyGuard unreachable — treat with caution if seen in production).
- **`latency_ms: 6120`** — this request took ~6.1 seconds end to end.

### Degraded response (`verdict: "FAIL"` or `"FAIL_AFTER_REVISION"`)
Recommendation text failed AI generation or quality checks. **Score is still valid and safe to display** — just render a fallback message where recommendation/roi_text would go.
```json
{
  "tss_score": 38.9,
  "risk_level": "High",
  "breakdown": { "...": "..." },
  "recommendation": null,
  "roi_text": null,
  "recommendation_unavailable": true,
  "partial_data": false,
  "verdict": "FAIL",
  "failed_checks": ["recommendation_generation_failed"],
  "latency_ms": 2975
}
```

**What this means:** the score (`38.9`, High risk) is still fully valid — it came from the deterministic formula, not AI, so it's trustworthy on its own. What failed is the AI-written explanation: either Groq didn't respond, or its answer didn't pass the critique agent's fact-check even after one retry (see `failed_checks` for why). The frontend should still show the score and risk badge normally, just swap in a fallback line like "Detailed recommendation temporarily unavailable" instead of leaving a blank space.

### Error response (`400`)
```json
{ "error": "lat and lng (numbers) are required" }
```

---

## Field guide for the frontend

| Field | UI use |
|---|---|
| `tss_score` | Headline number, 0–100 |
| `risk_level` | Badge — `"Low"` (green), `"Moderate"` (yellow), `"High"` (red) |
| `breakdown` | Stats row / mini chart — penalty contribution per category, plus raw metrics |
| `recommendation` | Body text. **Always check for `null`** and show a fallback (e.g. "Recommendation unavailable — score based on live site data.") |
| `roi_text` | Secondary body text, same null-check applies |
| `partial_data` | If `true`, show a small "partial data" notice — one of the three agents fell back to cached/estimated values |
| `sources` | Debug-only, not user-facing. Shows whether each agent used live/cache/mock data |
| `latency_ms` | Useful for your own loading-state tuning, not shown to users |

**Always render from `tss_score`, `risk_level`, and `breakdown` unconditionally** — those are always present regardless of verdict. Only `recommendation`/`roi_text` are conditional.

---

## What happens behind this one endpoint

The frontend never talks to these directly — this is just so whoever's debugging understands what the single `/api/screen-site` call is doing under the hood.

| Step | Agent | Calls | Output feeds into |
|---|---|---|---|
| 1 | Heat agent | FortyGuard `create_heatmap` | `exceedance_hours`, `heat_penalty` |
| 2 | Shade agent | FortyGuard `satellite_segmentation` + `street_view_segmentation` | `shade_pct`, `shade_penalty` |
| 3 | Financial agent | FortyGuard `environmental_parameters` | `wet_bulb_c`, `environmental_penalty` |
| 4 | Manager | deterministic formula (no AI) | `tss_score`, `risk_level` |
| 5 | Manager | Groq LLM call | `recommendation`, `roi_text` |
| 6 | Critique agent | Groq LLM call (fact-check + relevance) | `verdict` — may trigger one retry of step 5 |

Steps 1–3 run in parallel. Total worst-case latency ~21s (with one retry loop), typical ~14s — **plan the frontend loading state for this**, it's a "generate report" UX, not an instant response. `AgentStatusLoader.jsx` should show progressive messages, not a blank spinner.

---

## Quick test
```bash
curl -X POST http://localhost:4000/api/screen-site \
  -H "Content-Type: application/json" \
  -d "{\"lat\":33.44,\"lng\":-94.04}"
```

## Health check
```
GET /api/health   →   { "ok": true }
```
Use this to confirm the backend is reachable before debugging a screen-site failure.

---

## Calling this from another backend (not just the frontend)

Any backend can trigger the agents the same way the frontend does — one plain HTTP POST, no auth key, no separate calls per agent. The whole pipeline (all 3 employee agents + manager + critique) runs inside this one endpoint.

**Node.js (axios)**
```js
const res = await axios.post("http://your-backend-url/api/screen-site", {
  lat: 33.44,
  lng: -94.04
});
console.log(res.data); // tss_score, recommendation, etc.
```

**Node.js (fetch)**
```js
const res = await fetch("http://your-backend-url/api/screen-site", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ lat: 33.44, lng: -94.04 })
});
const data = await res.json();
```

**Python (requests)**
```python
import requests
res = requests.post("http://your-backend-url/api/screen-site", json={"lat": 33.44, "lng": -94.04})
print(res.json())
```

Replace `your-backend-url` with wherever this backend is deployed (e.g. `localhost:4000` for local dev).

