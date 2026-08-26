// Pure, deterministic checks — no LLM. Each returns { ok, errors: [], flags: [] }.

function validateHeat(d, thresholdRequested) {
  const errors = [];
  if (typeof d.exceedance_hours_per_day !== "number" || d.exceedance_hours_per_day < 0 || d.exceedance_hours_per_day > 24) {
    errors.push("exceedance_hours_per_day out of range 0-24");
  }
  if (typeof d.persistence_max_hours !== "number" || d.persistence_max_hours < 0 || d.persistence_max_hours > 24) {
    errors.push("persistence_max_hours out of range 0-24");
  }
  if (d.threshold_used_c !== thresholdRequested) {
    errors.push(`threshold_used_c (${d.threshold_used_c}) != requested (${thresholdRequested})`);
  }
  return { ok: errors.length === 0, errors, flags: [] };
}

function validateShade(d) {
  const errors = [];
  const flags = [];
  for (const f of ["canopy_pct", "pavement_pct", "building_pct", "ground_level_shade_pct"]) {
    if (typeof d[f] !== "number" || d[f] < 0 || d[f] > 100) {
      errors.push(`${f} out of range 0-100`);
    }
  }
  if (errors.length === 0) {
    const sum = d.canopy_pct + d.pavement_pct + d.building_pct;
    if (Math.abs(sum - 100) > 5) {
      errors.push(`canopy+pavement+building sums to ${sum}, expected ~100`);
    }
    const maxPlausibleShade = d.canopy_pct + d.building_pct + 10;
    if (d.ground_level_shade_pct > maxPlausibleShade) {
      flags.push("ground_level_shade_pct exceeds canopy+building by >10pts — needs critique review");
    }
  }
  return { ok: errors.length === 0, errors, flags };
}

function validateFinancial(d) {
  const errors = [];
  if (typeof d.wet_bulb_c !== "number" || d.wet_bulb_c < -10 || d.wet_bulb_c > 50) {
    errors.push("wet_bulb_c out of range -10..50");
  }
  if (typeof d.heat_index_c !== "number" || d.heat_index_c < d.wet_bulb_c || d.heat_index_c > 70) {
    errors.push("heat_index_c must be >= wet_bulb_c and <= 70");
  }
  if (typeof d.ghi_w_m2 !== "number" || d.ghi_w_m2 < 0 || d.ghi_w_m2 > 1200) {
    errors.push("ghi_w_m2 out of range 0-1200");
  }
  return { ok: errors.length === 0, errors, flags: [] };
}

// Job 2: cross-agent coherence — non-blocking, just produces notes for the critique agent
function coherenceCheck({ heat, shade, financial }) {
  const notes = [];
  if (shade.canopy_pct > 60 && heat.exceedance_hours_per_day > 8) {
    notes.push("High canopy % combined with high exceedance hours — possible time-of-day mismatch, not necessarily an error.");
  }
  if (financial.wet_bulb_c > 30 && shade.ground_level_shade_pct > 50) {
    notes.push("High wet-bulb with high ground shade — verify shade data reflects midday conditions, not just morning satellite pass.");
  }
  return notes;
}

module.exports = { validateHeat, validateShade, validateFinancial, coherenceCheck };
