# Voltherm

Eliminate EV site heat risk before you break ground. Voltherm screens candidate
charging sites with a multi-agent pipeline (heat, shade, financial, critique)
built on the FortyGuard Heat Intelligence API, and returns a single
Thermal Site Score (TSS) with a defensible breakdown.

This repo is a two-service app:

```
voltherm/
├── frontend/   Vite + React client (landing page + dashboard)
└── backend/    Node/Express API (agents, scoring, FortyGuard proxy)
```

The frontend **never** talks to FortyGuard or Anthropic directly — every
external call is proxied through the backend so API keys never reach the
browser.

## Quick start (local dev)

You'll need Node 18+ and two terminal tabs.

```bash
# 1. clone & install
git clone <this-repo> voltherm && cd voltherm
cp .env.example backend/.env      # fill in real keys
cp .env.example frontend/.env     # only VITE_API_BASE_URL is used here

# 2. backend
cd backend
npm install
npm run dev          # starts Express on http://localhost:4000

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev           # starts Vite on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` requests to
the backend (see `frontend/vite.config.js`), so the two run on separate
ports without any CORS headaches in dev.

## What's implemented vs. stubbed

This scaffold is wired end-to-end but the **agent intelligence itself is a
dummy placeholder** — see `backend/src/agents/*`. Each agent function is a
fully-typed stub that returns realistic mock output on a short delay, with a
clearly marked `// TODO(agent):` block showing where the real Anthropic-backed
reasoning goes. The deterministic parts (TSS scoring formula, validators,
routing, error handling, the whole frontend) are real and functional.

| Piece | Status |
|---|---|
| Landing page / dashboard UI | ✅ built |
| `AgentStatusLoader` multi-step loading UI | ✅ built |
| `POST /api/screen-site` route + validation | ✅ built |
| TSS scoring formula (`lib/tssFormula.js`) | ✅ built (deterministic) |
| `heatAgent`, `shadeAgent`, `financialAgent`, `critiqueAgent` | 🧪 dummy — plug in real model calls |
| `fortyguardClient` (5 endpoints) | 🧪 dummy — plug in real HTTP calls |
| `reportGenerator` (PDF export) | 🧪 dummy — plug in real PDF lib |
| Site storage (`db/sites.js`) | ✅ built (in-memory, swap for SQLite/Supabase) |

## Environment variables

See `.env.example` at the repo root for the full list. Copy the relevant
half into `backend/.env` and `frontend/.env`. `.env` files are gitignored;
never commit real keys.

## Scripts

| Location | Command | Does |
|---|---|---|
| `backend/` | `npm run dev` | Start API with hot reload (nodemon) |
| `backend/` | `npm start` | Start API in production mode |
| `frontend/` | `npm run dev` | Start Vite dev server |
| `frontend/` | `npm run build` | Production build to `frontend/dist` |
| `frontend/` | `npm run preview` | Preview the production build locally |

## Architecture at a glance

```
Browser ──▶ frontend (Vite/React)
              │  fetch('/api/screen-site')  — lib/api.js
              ▼
           backend (Express)
              │  routes/screenSite.js
              ▼
           agents/manager.js  ── orchestrates ──▶ heatAgent
                                              ├──▶ shadeAgent
                                              ├──▶ financialAgent
                                              └──▶ critiqueAgent
              │
              ▼
           lib/tssFormula.js  (deterministic scoring, §2 of spec)
              │
              ▼
           services/fortyguardClient.js  ──▶ FortyGuard Heat Intelligence API
           services/reportGenerator.js   ──▶ PDF export via heat_intelligence
```

## For judges

1. `cp .env.example backend/.env` and `cp .env.example frontend/.env` — the
   defaults are enough to run the app with dummy agent output, no real keys
   required.
2. Run backend then frontend as above.
3. Visit the dashboard, submit a site through the scorecard form, and watch
   `AgentStatusLoader` step through Heat → Shade → Financial → Critique
   before the TSS result renders.
