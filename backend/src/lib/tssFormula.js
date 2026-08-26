// Deterministic, no LLM. Each penalty is normalized 0-100, then weighted.
// Curves are first-pass estimates — tune against real FortyGuard data later.

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function heatPenalty(heat) {
  // 0 exceedance hours -> 0 penalty. 12+ hours/day over threshold -> 100 penalty.
  const hoursPenalty = clamp((heat.exceedance_hours_per_day / 12) * 70, 0, 70);
  // long unbroken hot stretches are worse than the same hours spread out
  const persistencePenalty = clamp((heat.persistence_max_hours / 6) * 30, 0, 30);
  return clamp(hoursPenalty + persistencePenalty, 0, 100);
}

function shadePenalty(shade) {
  // low canopy + low ground shade = high penalty
  const canopyPenalty = clamp((1 - shade.canopy_pct / 100) * 60, 0, 60);
  const groundShadePenalty = clamp((1 - shade.ground_level_shade_pct / 100) * 40, 0, 40);
  return clamp(canopyPenalty + groundShadePenalty, 0, 100);
}

function environmentalPenalty(env) {
  // wet-bulb is the dominant driver of real-world heat stress
  const wetBulbPenalty = clamp((env.wet_bulb_c / 35) * 60, 0, 60);
  const ghiPenalty = clamp((env.ghi_w_m2 / 1200) * 40, 0, 40);
  return clamp(wetBulbPenalty + ghiPenalty, 0, 100);
}

function computeTSS({ heat, shade, financial }) {
  const hp = heatPenalty(heat);
  const sp = shadePenalty(shade);
  const ep = environmentalPenalty(financial);

  const tss = clamp(100 - hp * 0.4 - sp * 0.35 - ep * 0.25, 0, 100);

  let riskLevel = "Low";
  if (tss < 40) riskLevel = "High";
  else if (tss < 70) riskLevel = "Moderate";

  return {
    tss_score: Math.round(tss * 10) / 10,
    risk_level: riskLevel,
    breakdown: {
      heat_penalty: Math.round(hp * 10) / 10,
      shade_penalty: Math.round(sp * 10) / 10,
      environmental_penalty: Math.round(ep * 10) / 10,
      exceedance_hours: heat.exceedance_hours_per_day,
      shade_pct: shade.ground_level_shade_pct,
      wet_bulb_c: financial.wet_bulb_c,
    },
  };
}

module.exports = { computeTSS, heatPenalty, shadePenalty, environmentalPenalty };
