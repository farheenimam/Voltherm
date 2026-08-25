/**
 * lib/api.js — the ONLY place the frontend talks to the network.
 *
 * Every call here hits VITE_API_BASE_URL (our own Express backend) — never
 * FortyGuard or Anthropic directly. Those services are proxied server-side
 * so their API keys never reach the browser. See:
 *   backend/src/services/fortyguardClient.js
 *   backend/src/agents/*
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(body?.error?.message || `Request to ${path} failed with ${res.status}`, res.status, body?.error?.details);
  }

  return body;
}

/** GET /api/health */
export function getHealth() {
  return request('/health');
}

/**
 * POST /api/screen-site
 * Submits a candidate site and runs the full agent pipeline.
 * @param {object} siteInput - see backend/src/lib/validators.js for the shape
 */
export function screenSite(siteInput) {
  return request('/screen-site', {
    method: 'POST',
    body: JSON.stringify(siteInput),
  });
}

/** GET /api/screen-site — recently screened sites, for the dashboard */
export function listSites() {
  return request('/screen-site');
}

/** GET /api/screen-site/:id */
export function getSite(id) {
  return request(`/screen-site/${id}`);
}

/** GET /api/screen-site/:id/report — triggers a PDF download */
export function getSiteReportUrl(id) {
  return `${API_BASE_URL}/screen-site/${id}/report`;
}

export { ApiError };

export default { getHealth, screenSite, listSites, getSite, getSiteReportUrl };
