const fortyguard = require("../services/fortyguardClient");
const { validateShade } = require("../lib/validators");

async function runShadeAgent({ lat, lng }) {
  const [sat, street] = await Promise.all([
    fortyguard.satelliteSegmentation({ lat, lng }),
    fortyguard.streetViewSegmentation({ lat, lng }),
  ]);

  // street-view can fail independently; satellite-only is still useful (spec fallback)
  const combined = {
    canopy_pct: sat.data.canopy_pct,
    pavement_pct: sat.data.pavement_pct,
    building_pct: sat.data.building_pct,
    ground_level_shade_pct: street.data.ground_level_shade_pct,
  };

  const validation = validateShade(combined);

  const confidence =
    sat.confidence === "high" && street.confidence === "high" ? "high" : "medium";

  return {
    agent: "shade",
    data: combined,
    source: { satellite: sat.source, street_view: street.source },
    confidence,
    unavailable: !validation.ok,
    errors: validation.errors,
    flags: validation.flags,
  };
}

module.exports = { runShadeAgent };
