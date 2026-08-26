# Testing Voltherm with real API keys (local)

Keys stay on your machine — nothing gets pasted anywhere else.

## 1. Get your keys
- **Groq**: https://console.groq.com/keys → create an API key
- **FortyGuard**: whatever process they gave you for API access

## 2. Fill in `.env`
```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in:
```
GROQ_API_KEY=gsk_...
FORTYGUARD_API_KEY=...
```
(Leave the per-agent `FORTYGUARD_API_KEY_HEAT/SHADE/FINANCIAL` blank for now — they'll fall back to the shared key. Fill those in later if FortyGuard gives you separate keys per endpoint.)

## 3. Install deps and start the server
```bash
npm install
npm run dev
```
Leave this running in one terminal.

## 4. Run the test script
In a second terminal:
```bash
cd backend
chmod +x test-live.sh
./test-live.sh
```

The script:
1. Checks your `.env` actually has keys before running.
2. Hits `/api/health`.
3. Makes a **cold** request to a site — you should see `sources.*` say `"live"` and `verdict: "PASS"` with a real `recommendation`/`roi_text`.
4. Repeats the same coordinates — `sources.*` should flip to `"cache"` and `latency_ms` should drop sharply.
5. Hits a different site to confirm fresh live calls happen per-site.
6. Sends invalid input to confirm the 400 error path still works.

## 5. What "working" looks like
| Check | Expected |
|---|---|
| Request #2 (cold) | `verdict: "PASS"`, `sources.heat/shade/financial` = `"live"` |
| `recommendation` / `roi_text` | Real sentences referencing your actual numbers, not `null` |
| Request #3 (repeat) | `sources.*` = `"cache"`, noticeably lower `latency_ms` |
| Request #4 (new site) | `sources.*` = `"live"` again (different cache key) |
| Request #5 (bad input) | `HTTP 400` |

## 6. If something's off
- `sources.*` stuck on `"mock"` → FortyGuard key isn't being read or the API call is failing. Check `npm run dev` logs — errors get printed there.
- `recommendation: null`, `verdict: "FAIL"` → Groq key issue. Check logs for a `Groq 4xx/5xx` error message.
- `verdict: "FAIL_AFTER_REVISION"` → Groq's response failed the critique's grounding/relevance check twice in a row. Check the actual recommendation text in the logs against your source data — might be a real fabrication, or the critique prompt may need tuning.
- Timeouts on live FortyGuard calls → check `FORTYGUARD_BASE_URL` in `.env` matches what they gave you, and confirm your key has access to `create_heatmap`, `satellite_segmentation`, `street_view_segmentation`, `environmental_parameters`.

## 7. Cleanup
`.env` is already gitignored — don't commit it. If you ever pasted a key somewhere by accident, rotate it in the Groq/FortyGuard dashboard.
