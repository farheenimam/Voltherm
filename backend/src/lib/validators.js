/**
 * Validation rules for incoming site-screening requests.
 *
 * Each agent only needs a subset of the submitted fields — this module
 * validates the request shape as a whole (screenSiteRequest) and exposes
 * the per-agent field lists so `agents/manager.js` can slice the payload
 * before handing it to each sub-agent.
 */

import { ApiError } from '../middleware/errorHandler.js';

/** Fields required by each agent. Used by manager.js to slice the payload. */
export const AGENT_FIELDS = {
  heat: ['latitude', 'longitude', 'surfaceType', 'canopyCoveragePct'],
  shade: ['latitude', 'longitude', 'nearbyStructures', 'treeCoveragePct', 'orientation'],
  financial: ['estimatedChargerCount', 'chargerPowerKw', 'nevifunding', 'regionUtilityRateUsdKwh'],
  critique: ['heatResult', 'shadeResult', 'financialResult'],
};

const REQUIRED_TOP_LEVEL = ['siteName', 'address', 'latitude', 'longitude'];

/**
 * Validates a POST /api/screen-site request body.
 * Throws ApiError(400, ...) on the first failure.
 */
export function validateScreenSiteRequest(body) {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  const missing = REQUIRED_TOP_LEVEL.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) {
    throw new ApiError(400, `Missing required field(s): ${missing.join(', ')}`, { missing });
  }

  const { latitude, longitude } = body;
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    throw new ApiError(400, 'latitude must be a number between -90 and 90.');
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw new ApiError(400, 'longitude must be a number between -180 and 180.');
  }

  if (body.surfaceType && !['asphalt', 'concrete', 'gravel', 'mixed'].includes(body.surfaceType)) {
    throw new ApiError(400, "surfaceType must be one of: asphalt, concrete, gravel, mixed.");
  }

  const pctFields = ['canopyCoveragePct', 'treeCoveragePct'];
  for (const field of pctFields) {
    const value = body[field];
    if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 100)) {
      throw new ApiError(400, `${field} must be a number between 0 and 100.`);
    }
  }

  return true;
}

/** Pulls just the fields a given agent cares about out of the full payload. */
export function sliceForAgent(agentName, payload) {
  const fields = AGENT_FIELDS[agentName];
  if (!fields) {
    throw new Error(`Unknown agent name: ${agentName}`);
  }
  return fields.reduce((slice, field) => {
    if (payload[field] !== undefined) slice[field] = payload[field];
    return slice;
  }, {});
}
