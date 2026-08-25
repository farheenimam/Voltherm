/**
 * fortyguardClient — thin wrapper around the FortyGuard Heat Intelligence API.
 *
 * DUMMY IMPLEMENTATION. Every method below returns realistic mock data after
 * a short simulated delay instead of making a real HTTP call. Swap the body
 * of each method for a real `fetch`/`axios` call to FORTYGUARD_BASE_URL,
 * authenticated with FORTYGUARD_API_KEY — the request/response shapes are
 * already the contract the rest of the app (agents/*) is written against.
 *
 * This file is the ONLY place in the codebase that should hold or reference
 * FORTYGUARD_API_KEY. Never import this on the frontend.
 */

const FORTYGUARD_BASE_URL = process.env.FORTYGUARD_BASE_URL || 'https://api.fortyguard.com/v1';
const FORTYGUARD_API_KEY = process.env.FORTYGUARD_API_KEY;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shared low-level request helper.
 * TODO(fortyguard): replace with a real fetch() once wiring up the live API:
 *
 *   const res = await fetch(`${FORTYGUARD_BASE_URL}${path}`, {
 *     method,
 *     headers: {
 *       'Authorization': `Bearer ${FORTYGUARD_API_KEY}`,
 *       'Content-Type': 'application/json',
 *     },
 *     body: body ? JSON.stringify(body) : undefined,
 *   });
 *   if (!res.ok) throw new Error(`FortyGuard ${path} failed: ${res.status}`);
 *   return res.json();
 */
async function request(path, { method = 'GET', body } = {}) {
  if (!FORTYGUARD_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn('[fortyguardClient] FORTYGUARD_API_KEY is not set — returning dummy data only.');
  }
  await delay(250 + Math.random() * 250);
  return { __dummy: true, path, method, body };
}

/** 1. Surface temperature for a lat/lng, optionally over a date range. */
export async function getSurfaceTemperature({ latitude, longitude, date } = {}) {
  await request('/surface-temperature', { method: 'POST', body: { latitude, longitude, date } });
  return {
    latitude,
    longitude,
    date: date || new Date().toISOString().slice(0, 10),
    surfaceTempF: 148,
    ambientTempF: 96,
    surfaceTempDeltaF: 52,
    source: 'dummy:fortyguard.surface-temperature',
  };
}

/** 2. Shade / canopy coverage analysis for a site polygon or point + radius. */
export async function getShadeCoverage({ latitude, longitude, radiusMeters = 50 } = {}) {
  await request('/shade-coverage', { method: 'POST', body: { latitude, longitude, radiusMeters } });
  return {
    latitude,
    longitude,
    radiusMeters,
    shadeCoveragePct: 8,
    treeCoveragePct: 3,
    structureShadePct: 5,
    source: 'dummy:fortyguard.shade-coverage',
  };
}

/** 3. Seasonal thermal forecast — projected derating windows across the year. */
export async function getSeasonalForecast({ latitude, longitude } = {}) {
  await request('/seasonal-forecast', { method: 'POST', body: { latitude, longitude } });
  return {
    latitude,
    longitude,
    months: [
      { month: 'Jun', projectedDeratingHours: 62 },
      { month: 'Jul', projectedDeratingHours: 94 },
      { month: 'Aug', projectedDeratingHours: 88 },
      { month: 'Sep', projectedDeratingHours: 41 },
    ],
    totalAnnualDeratingHours: 285,
    source: 'dummy:fortyguard.seasonal-forecast',
  };
}

/** 4. Site comparison — benchmark a site against nearby/similar screened sites. */
export async function compareSites({ latitude, longitude, radiusMiles = 25 } = {}) {
  await request('/site-comparison', { method: 'POST', body: { latitude, longitude, radiusMiles } });
  return {
    latitude,
    longitude,
    radiusMiles,
    comparableSiteCount: 6,
    percentileRank: 34,
    source: 'dummy:fortyguard.site-comparison',
  };
}

/** 5. Heat intelligence report — the underlying data used for PDF export. */
export async function getHeatIntelligenceReport({ siteId, latitude, longitude } = {}) {
  await request('/heat-intelligence-report', { method: 'POST', body: { siteId, latitude, longitude } });
  return {
    siteId,
    latitude,
    longitude,
    generatedAt: new Date().toISOString(),
    sections: ['surface-temperature', 'shade-coverage', 'seasonal-forecast', 'site-comparison'],
    source: 'dummy:fortyguard.heat-intelligence-report',
  };
}

export default {
  getSurfaceTemperature,
  getShadeCoverage,
  getSeasonalForecast,
  compareSites,
  getHeatIntelligenceReport,
};
