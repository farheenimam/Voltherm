# VoltShield (Voltherm) — Climate-Resilient EV Siting Copilot

**Built for the FortyGuard Urban Heat Hackathon 2026**

Eliminate EV site heat risk before you break ground. VoltShield screens candidate DC fast charging sites with an autonomous multi-agent pipeline built on the **FortyGuard Heat Intelligence API** and **Groq LLM**, returning a deterministic **Thermal Siting Score (TSS 0–100)**, an interactive **Mitigation Design Canvas**, and federal **NEVI 97% Uptime SLA Compliance Audits**.

---

## 🌟 Key Architecture & Capabilities

```
Voltherm/
├── frontend/    Landing Page (Photo hero, before/after thermal evidence, 1-click launch)
├── dashboard/   11-Screen Enterprise Command Center (Portfolio, Grid Map, Wizard, Sandbox, Mitigation Editor, NEVI Report)
└── backend/     Node/Express API + SQLite (voltherm.db) + Multi-Agent Pipeline + FortyGuard API + Groq LLM
```

### 1. FortyGuard 10m Hyperlocal Urban Heat Intelligence
* Live integration with `api.fortyguard.com` using dedicated API keys for Heat Exceedance, Shade Segmentation, and Financial Curailment.
* Identifies localized microclimate heat bubbles on dark asphalt parcels that regional weather stations miss.

### 2. Autonomous Multi-Agent Pipeline
* **Heat Agent:** Queries FortyGuard 10m LTM for annual hours exceeding 35°C (95°F).
* **Shade Agent:** Segments satellite imagery for tree canopy deficit and surface albedo absorption.
* **Financial Agent:** Computes curtailed power losses ($/yr) based on local utility tariffs and charging dwell times.
* **Manager Agent:** Synthesizes findings, computes deterministic TSS, and drafts engineering recommendations via Groq LLM.
* **Critique Agent:** Automated fact-checker running 4 validation tests (Numeric Consistency, Fact Grounding, Relevance, Completeness) with bounded revision loops.

### 3. Persistent SQLite Database (`backend/voltherm.db`)
* Powered by `better-sqlite3` with Write-Ahead Logging (`WAL` mode).
* Persists candidate sites, GPS parcel coordinates, hardware configurations, dispenser telemetry, applied mitigations, and AI Copilot chat history.

### 4. Interactive Mitigation Design Canvas
* Live geospatial Leaflet canvas centered on the parcel.
* Real-time toggles for **Bifacial Solar Canopies** and **High-Albedo Reflective Sealcoats**.
* Instant recalculation of mitigated TSS (+24 to +46 pts), surface cooling (-12°F), and 1.7-year CAPEX payback.

### 5. NEVI 97% Uptime Compliance Audit Report
* Formal engineering letterhead report with GIS satellite snapshot, economic loss breakdown, mitigation ROI specs, and Professional Engineer (PE) certification block ready for state DOT grant awards.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* Node.js 18+

### 1. Launch the Services

In 3 separate terminal tabs (or run from root):

```bash
# Terminal 1: Backend API & SQLite Database (:4000)
npm run backend

# Terminal 2: Enterprise Command Center Dashboard (:5173)
npm run dashboard

# Terminal 3: Public Marketing Landing Page (:5174)
npm run landing
```

### 2. Access the Applications
* **Command Center Dashboard:** [http://localhost:5173/portfolio](http://localhost:5173/portfolio) (Zero login friction, auto-authenticated as Senior Siting Director *Mara Velasquez, PE*)
* **Public Landing Page:** [http://localhost:5174/](http://localhost:5174/) (Photo hero, before/after thermal evidence, 1-click command center launch)
* **Backend Health & REST API:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 📮 API Endpoints & Postman Collection

Import the included Postman Collection:
👉 **[`Voltherm_API.postman_collection.json`](file:///Users/ishaq/Desktop/react/Voltherm/Voltherm_API.postman_collection.json)**

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service liveness check |
| `GET` | `/api/sites` | List all sites & portfolio aggregates from SQLite |
| `GET` | `/api/sites/:id` | Fetch complete parcel telemetry & dispenser nodes |
| `POST` | `/api/sites` | Create a new candidate site from wizard inputs |
| `PUT` | `/api/sites/:id/mitigations` | Persist solar canopy and albedo mitigations to SQLite |
| `POST` | `/api/copilot/chat` | Ask VoltShield AI Copilot (Groq LLM with site context) |
| `POST` | `/api/screen-site` | Run 5-agent pipeline on GPS coordinates |
| `POST` | `/api/screen-sites` | Multi-site comparative portfolio audit |
