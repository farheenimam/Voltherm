// VoltShield Frontend API Service Layer
// Communicates with Node.js Express backend and SQLite database (voltherm.db)

const API_BASE = '/api';

/**
 * Fetch all sites from SQLite with summary aggregates
 */
export async function fetchSites() {
  try {
    const res = await fetch(`${API_BASE}/sites`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.sites || [];
  } catch (err) {
    console.warn('[API] Failed to fetch sites from backend, using local fallback:', err.message);
    const saved = localStorage.getItem('voltshield_sites');
    return saved ? JSON.parse(saved) : [];
  }
}

/**
 * Fetch a single site by ID
 */
export async function fetchSiteById(siteId) {
  try {
    const res = await fetch(`${API_BASE}/sites/${siteId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] Failed to fetch site ${siteId} from backend:`, err.message);
    return null;
  }
}

/**
 * Create / Screen a new site via Setup Wizard
 */
export async function createSite(siteData) {
  try {
    const res = await fetch(`${API_BASE}/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend unreachable; generating local site record:', err.message);
    return {
      ...siteData,
      site_id: `site_${Date.now().toString().slice(-4)}`,
      metrics: {
        thermal_siting_score: 55,
        risk_level: 'MEDIUM RISK',
        annual_derating_hours: 220,
        shade_coverage_pct: 5.0,
        estimated_revenue_loss_usd: 7500
      },
      charts: {
        heat_dissipated_pct: 60,
        heat_retained_pct: 40,
        monthly_throttling_hours: [15, 25, 45, 60, 80, 75, 40, 20],
        efficiency_trend: [100, 98, 95, 90, 85, 75, 65, 55]
      },
      charger_nodes: [
        { station_id: 'Station 1 (LOCAL-A)', max_load_kw: 180, peak_temp_f: 104, status: 'Normal' }
      ]
    };
  }
}

/**
 * Save physical mitigations for a site
 */
export async function saveMitigations(siteId, mitigations) {
  try {
    const res = await fetch(`${API_BASE}/sites/${siteId}/mitigations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mitigations })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.site;
  } catch (err) {
    console.warn(`[API] Failed to save mitigations to backend for ${siteId}:`, err.message);
    return null;
  }
}

/**
 * Send prompt to VoltShield AI Copilot (Groq LLM)
 */
export async function sendCopilotChat(siteId, message) {
  try {
    const res = await fetch(`${API_BASE}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: siteId, message })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.warn('[API] Copilot backend call failed:', err.message);
    return "VoltShield Copilot is operating in offline mode. Please verify the backend on port 4000.";
  }
}

/**
 * Fetch Copilot chat history for a site
 */
export async function fetchChatHistory(siteId) {
  try {
    const res = await fetch(`${API_BASE}/copilot/chat/${siteId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    return [];
  }
}
