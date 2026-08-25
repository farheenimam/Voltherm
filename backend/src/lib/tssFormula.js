/**
 * Deterministic Thermal Site Score (TSS) calculation — spec §2.
 *
 * This is the one piece of scoring math in the pipeline that is NOT an LLM
 * call: given the structured outputs of the heat, shade, and financial
 * agents, it produces a single 0–100 score plus a letter-graded band, so the
 * same inputs always produce the same score (auditable for NEVI /
 * procurement purposes).
 *
 * Weighting (sums to 1.0):
 *   - Heat exposure risk     45%   (surface temp delta, canopy coverage)
 *   - Shade adequacy         30%   (tree + structure shade coverage)
 *   - Financial exposure     25%   (derating hours -> revenue at risk)
 *
 * Each sub-score is normalized to 0–100 where 100 = best (lowest risk)
 * before weighting, so a higher TSS is always better.
 */

export const TSS_WEIGHTS = Object.freeze({
  heat: 0.45,
  shade: 0.3,
  financial: 0.25,
});

export const TSS_BANDS = Object.freeze([
  { min: 90, label: 'Excellent', color: '#39D97A' },
  { min: 75, label: 'Good', color: '#39D97A' },
  { min: 60, label: 'Flagged', color: '#F2B84B' },
  { min: 40, label: 'At Risk', color: '#F2B84B' },
  { min: 0, label: 'High Risk', color: '#E5484D' },
]);

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {object} heatResult - output of heatAgent, expects `surfaceTempDeltaF` and `canopyCoveragePct`
 * @param {object} shadeResult - output of shadeAgent, expects `shadeCoveragePct`
 * @param {object} financialResult - output of financialAgent, expects `annualDeratingHours`, `estimatedChargerCount`
 * @returns {{ score: number, band: object, breakdown: object }}
 */
export function calculateTSS(heatResult = {}, shadeResult = {}, financialResult = {}) {
  // --- Heat sub-score: worse surface temp delta and lower canopy = higher risk ---
  const surfaceTempDeltaF = heatResult.surfaceTempDeltaF ?? 35; // default: hot asphalt scenario
  const canopyCoveragePct = heatResult.canopyCoveragePct ?? 0;
  // 0°F delta -> 100, 60°F+ delta -> 0, canopy coverage offsets up to 20 pts
  const heatSubscore = clamp(100 - (surfaceTempDeltaF / 60) * 100 + canopyCoveragePct * 0.2);

  // --- Shade sub-score: direct mapping from % coverage, with diminishing returns after 60% ---
  const shadeCoveragePct = shadeResult.shadeCoveragePct ?? 0;
  const shadeSubscore = clamp(shadeCoveragePct >= 60 ? 90 + (shadeCoveragePct - 60) * 0.25 : shadeCoveragePct * 1.5);

  // --- Financial sub-score: derating hours per charger per year, weighted against uptime target ---
  const annualDeratingHours = financialResult.annualDeratingHours ?? 0;
  const chargerCount = financialResult.estimatedChargerCount || 1;
  const deratingHoursPerCharger = annualDeratingHours / chargerCount;
  // 0 hrs -> 100, 500+ hrs/charger/yr -> 0
  const financialSubscore = clamp(100 - (deratingHoursPerCharger / 500) * 100);

  const weighted =
    heatSubscore * TSS_WEIGHTS.heat +
    shadeSubscore * TSS_WEIGHTS.shade +
    financialSubscore * TSS_WEIGHTS.financial;

  const score = Math.round(clamp(weighted));
  const band = TSS_BANDS.find((b) => score >= b.min) || TSS_BANDS[TSS_BANDS.length - 1];

  return {
    score,
    band,
    breakdown: {
      heat: { subscore: Math.round(heatSubscore), weight: TSS_WEIGHTS.heat },
      shade: { subscore: Math.round(shadeSubscore), weight: TSS_WEIGHTS.shade },
      financial: { subscore: Math.round(financialSubscore), weight: TSS_WEIGHTS.financial },
    },
  };
}
