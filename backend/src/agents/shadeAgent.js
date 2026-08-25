/**
 * shadeAgent — analyzes existing and potential shade coverage for a site.
 *
 * DUMMY IMPLEMENTATION. See heatAgent.js for the pattern this follows.
 */

import { getShadeCoverage } from '../services/fortyguardClient.js';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} siteFields - sliced site payload (lat/lng, nearbyStructures, treeCoveragePct, orientation)
 * @returns {Promise<object>} shadeResult — consumed by tssFormula.calculateTSS
 */
export async function runShadeAgent(siteFields) {
  const { latitude, longitude, nearbyStructures = [], treeCoveragePct = 0, orientation = 'unspecified' } = siteFields;

  await delay(800 + Math.random() * 600);

  const shade = await getShadeCoverage({ latitude, longitude });

  // TODO(agent): replace this block with a real Anthropic call that reasons
  // over the FortyGuard shade-coverage tool output plus `nearbyStructures`
  // and `orientation` to identify realistic shade-structure placement
  // opportunities (e.g. canopy orientation relative to solar azimuth).

  const shadeCoveragePct = Math.max(shade.shadeCoveragePct, treeCoveragePct);
  const structureCount = Array.isArray(nearbyStructures) ? nearbyStructures.length : 0;

  return {
    agent: 'shade',
    orientation,
    shadeCoveragePct,
    treeCoveragePct,
    structureShadePct: shade.structureShadePct,
    nearbyStructureCount: structureCount,
    riskLevel: shadeCoveragePct < 20 ? 'high' : shadeCoveragePct < 50 ? 'moderate' : 'low',
    findings: [
      `Site currently has ${shadeCoveragePct}% effective shade coverage during peak hours.`,
      structureCount > 0
        ? `${structureCount} nearby structure(s) could be leveraged for partial afternoon shade.`
        : 'No nearby structures identified for passive shading.',
    ],
    recommendedActions: shadeCoveragePct < 20 ? ['Install cantilevered solar canopy over charging stalls', 'Plant fast-growing native shade trees along south/west edge'] : [],
    source: 'dummy:shadeAgent',
  };
}

export default { runShadeAgent };
