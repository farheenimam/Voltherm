/**
 * heatAgent — analyzes surface heat exposure risk for a candidate site.
 *
 * DUMMY IMPLEMENTATION. Simulates thinking time and returns a plausible,
 * internally-consistent mock result shaped exactly like the real agent's
 * eventual output, so the rest of the pipeline (tssFormula, critiqueAgent,
 * the frontend) can be built against a stable contract today.
 *
 * Real inputs available: whatever fields are listed under `heat` in
 * lib/validators.js#AGENT_FIELDS, plus FortyGuard's surface-temperature data.
 */

import { getSurfaceTemperature } from '../services/fortyguardClient.js';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} siteFields - sliced site payload (lat/lng, surfaceType, canopyCoveragePct)
 * @returns {Promise<object>} heatResult — consumed by tssFormula.calculateTSS
 */
export async function runHeatAgent(siteFields) {
  const { latitude, longitude, surfaceType = 'asphalt', canopyCoveragePct = 0 } = siteFields;

  await delay(900 + Math.random() * 600); // simulate model + tool-call latency

  const surfaceTemp = await getSurfaceTemperature({ latitude, longitude });

  // TODO(agent): replace this block with a real Anthropic call, e.g.
  //
  //   const response = await anthropic.messages.create({
  //     model: 'claude-sonnet-4-6',
  //     max_tokens: 800,
  //     tools: [fortyguardSurfaceTempTool],
  //     messages: [{
  //       role: 'user',
  //       content: `Assess surface heat exposure risk for a candidate EV
  //         charging site at (${latitude}, ${longitude}) with surface type
  //         "${surfaceType}" and ${canopyCoveragePct}% canopy coverage. Use
  //         the FortyGuard surface-temperature tool and return a structured
  //         risk assessment.`,
  //     }],
  //   });
  //   return parseHeatAgentResponse(response);

  const surfaceTypeRiskModifier = { asphalt: 1.15, concrete: 1.0, gravel: 0.9, mixed: 1.05 }[surfaceType] ?? 1.0;
  const surfaceTempDeltaF = Math.round(surfaceTemp.surfaceTempDeltaF * surfaceTypeRiskModifier);

  return {
    agent: 'heat',
    surfaceType,
    canopyCoveragePct,
    surfaceTempF: surfaceTemp.surfaceTempF,
    ambientTempF: surfaceTemp.ambientTempF,
    surfaceTempDeltaF,
    riskLevel: surfaceTempDeltaF > 45 ? 'high' : surfaceTempDeltaF > 25 ? 'moderate' : 'low',
    findings: [
      `Surface reads ${surfaceTempDeltaF}\u00b0F above ambient on a peak summer afternoon.`,
      canopyCoveragePct < 10
        ? 'Minimal existing canopy coverage does little to offset radiant heat.'
        : `${canopyCoveragePct}% canopy coverage provides partial mitigation.`,
    ],
    recommendedActions: surfaceTempDeltaF > 45 ? ['Add reflective/cool pavement coating', 'Introduce structural shade over stall area'] : [],
    source: 'dummy:heatAgent',
  };
}

export default { runHeatAgent };
