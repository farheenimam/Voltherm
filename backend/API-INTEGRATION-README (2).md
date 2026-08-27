const cache = require("./cache");
const mockData = require("../lib/mockData");

const BASE_URL = process.env.FORTYGUARD_BASE_URL || "https://api.fortyguard.com/v1";

// Each employee agent gets its own key. Falls back to the shared key if a
// per-agent one isn't set, so a single-key setup still works.
const KEYS = {
  heat: process.env.FORTYGUARD_API_KEY_HEAT || process.env.FORTYGUARD_API_KEY,
  shade: process.env.FORTYGUARD_API_KEY_SHADE || process.env.FORTYGUARD_API_KEY,
  financial: process.env.FORTYGUARD_API_KEY_FINANCIAL || process.env.FORTYGUARD_API_KEY,
};

// --- DEBUG: prints once when the server starts, tells us definitively
// whether the .env values actually reached this file. Remove once confirmed working.
console.log("=== FortyGuard key check (on server startup) ===");
console.log("BASE_URL:", BASE_URL);
console.log("heat key present:", !!KEYS.heat, KEYS.heat ? `(starts with: ${KEYS.heat.slice(0, 4)}...)` : "");
console.log("shade key present:", !!KEYS.shade, KEYS.shade ? `(starts with: ${KEYS.shade.slice(0, 4)}...)` : "");
console.log("financial key present:", !!KEYS.financial, KEYS.financial ? `(starts with: ${KEYS.financial.slice(0, 4)}...)` : "");
console.log("=================================================");

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h — "frequently asked" sites hit this
const STALE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h — last-resort cached fallback

async function callWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`FortyGuard ${res.status}: ${await res.text()}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generic fetch-with-cache-retry-mock wrapper used by every employee agent.
 *
 * @param {string} agentName  "heat" | "shade" | "financial"
 * @param {string} cacheKey   cache.keyFor(...) result
 * @param {Function} fetchFn  async () => rawApiResponse
 * @param {number} timeoutMs
 * @param {Object} mockFallback  static object to use if everything fails
 */
async function fetchWithResilience({ agentName, cacheKey, fetchFn, timeoutMs, mockFallback }) {
  // 1. cache hit — fast path for frequently-requested sites
  const cached = cache.get(cacheKey);
  if (cached) {
    return { data: cached, source: "cache", confidence: "high" };
  }

  // 2. live call, with one retry (2s backoff)
  try {
    const data = await callWithTimeout(fetchFn.url, fetchFn.options, timeoutMs);
    cache.set(cacheKey, data, CACHE_TTL_MS);
    return { data, source: "live", confidence: "high" };
  } catch (firstErr) {
    console.error(`[FortyGuard:${agentName}] first attempt failed:`, firstErr.message);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const data = await callWithTimeout(fetchFn.url, fetchFn.options, timeoutMs);
      cache.set(cacheKey, data, CACHE_TTL_MS);
      return { data, source: "live-retry", confidence: "high" };
    } catch (secondErr) {
      console.error(`[FortyGuard:${agentName}] retry also failed:`, secondErr.message);
      // 3. stale cache (<24h old) for this exact site
      const stale = cache.getStale(cacheKey, STALE_MAX_AGE_MS);
      if (stale) {
        console.warn(`[FortyGuard:${agentName}] falling back to stale cache`);
        return { data: stale, source: "stale-cache", confidence: "medium" };
      }
      // 4. static mock — keeps the pipeline demo-able without live FortyGuard access
      console.warn(`[FortyGuard:${agentName}] falling back to MOCK data — check API key / base URL`);
      return { data: mockFallback, source: "mock", confidence: "low" };
    }
  }
}

function authHeaders(agentName) {
  return {
    Authorization: `Bearer ${KEYS[agentName]}`,
    "Content-Type": "application/json",
  };
}

// ---- Heat agent: create_heatmap ----
async function createHeatmap({ lat, lng, thresholdC = 35 }) {
  const cacheKey = cache.keyFor("heat", lat, lng, thresholdC);
  return fetchWithResilience({
    agentName: "heat",
    cacheKey,
    timeoutMs: 8000,
    mockFallback: mockData.heat,
    fetchFn: {
      url: `${BASE_URL}/create_heatmap`,
      options: {
        method: "POST",
        headers: authHeaders("heat"),
        body: JSON.stringify({ lat, lng, threshold_c: thresholdC }),
      },
    },
  });
}

// ---- Shade agent: satellite_segmentation + street_view_segmentation ----
async function satelliteSegmentation({ lat, lng }) {
  const cacheKey = cache.keyFor("shade-sat", lat, lng);
  return fetchWithResilience({
    agentName: "shade",
    cacheKey,
    timeoutMs: 5000,
    mockFallback: {
      canopy_pct: mockData.shade.canopy_pct,
      pavement_pct: mockData.shade.pavement_pct,
      building_pct: mockData.shade.building_pct,
    },
    fetchFn: {
      url: `${BASE_URL}/satellite_segmentation`,
      options: {
        method: "POST",
        headers: authHeaders("shade"),
        body: JSON.stringify({ lat, lng }),
      },
    },
  });
}

async function streetViewSegmentation({ lat, lng }) {
  const cacheKey = cache.keyFor("shade-street", lat, lng);
  return fetchWithResilience({
    agentName: "shade",
    cacheKey,
    timeoutMs: 5000,
    mockFallback: { ground_level_shade_pct: mockData.shade.ground_level_shade_pct },
    fetchFn: {
      url: `${BASE_URL}/street_view_segmentation`,
      options: {
        method: "POST",
        headers: authHeaders("shade"),
        body: JSON.stringify({ lat, lng }),
      },
    },
  });
}

// ---- Financial agent: environmental_parameters ----
async function environmentalParameters({ lat, lng }) {
  const cacheKey = cache.keyFor("financial", lat, lng);
  return fetchWithResilience({
    agentName: "financial",
    cacheKey,
    timeoutMs: 6000,
    mockFallback: mockData.financial,
    fetchFn: {
      url: `${BASE_URL}/environmental_parameters`,
      options: {
        method: "POST",
        headers: authHeaders("financial"),
        body: JSON.stringify({ lat, lng }),
      },
    },
  });
}

module.exports = {
  createHeatmap,
  satelliteSegmentation,
  streetViewSegmentation,
  environmentalParameters,
};