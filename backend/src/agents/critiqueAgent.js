/**
 * critiqueAgent — the "manager reviews the team's work" step. Reads the
 * heat/shade/financial results plus the deterministic TSS and produces a
 * short human-readable narrative, flags any internal inconsistencies, and
 * ranks the recommended mitigations by cost-effectiveness.
 *
 * DUMMY IMPLEMENTATION. See heatAgent.js for the pattern this follows.
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} results - { heatResult, shadeResult, financialResult, tss }
 * @returns {Promise<object>} critiqueResult — the final narrative shown on the scorecard
 */
export async function runCritiqueAgent(results) {
  const { heatResult, shadeResult, financialResult, tss } = results;

  await delay(700 + Math.random() * 500);

  // TODO(agent): replace this block with a real Anthropic call, prompted to:
  //   1. sanity-check the three sub-agent outputs against each other
  //      (e.g. "shade agent claims 60% coverage but heat agent's surface
  //      temp implies near-zero canopy — flag the conflict"),
  //   2. write a 2-3 sentence plain-English summary for a non-technical
  //      reviewer, and
  //   3. rank recommendedActions from all three agents by estimated
  //      TSS-points-per-dollar.

  const allRecommendations = [
    ...(heatResult?.recommendedActions || []).map((action) => ({ action, source: 'heat' })),
    ...(shadeResult?.recommendedActions || []).map((action) => ({ action, source: 'shade' })),
  ];

  const summary =
    tss.score >= 75
      ? `This site screens well (TSS ${tss.score}). Existing shade and moderate surface temperatures keep derating risk low — no mitigations required before proceeding.`
      : tss.score >= 60
      ? `This site is flagged (TSS ${tss.score}). Heat and shade exposure are borderline; the recommended mitigations below would likely push the score into the "Good" range.`
      : `This site carries meaningful thermal risk (TSS ${tss.score}). Financial exposure from projected derating is significant — mitigation should be priced into the site plan or an alternate site considered.`;

  return {
    agent: 'critique',
    summary,
    consistencyFlags: [], // TODO(agent): real cross-agent consistency checks
    prioritizedRecommendations: allRecommendations.slice(0, 4),
    confidence: 'medium', // TODO(agent): derive from agreement across sub-agents
    source: 'dummy:critiqueAgent',
  };
}

export default { runCritiqueAgent };
