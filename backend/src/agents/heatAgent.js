const fortyguard = require("../services/fortyguardClient");
const { validateHeat } = require("../lib/validators");

const THRESHOLD_C = 35;

async function runHeatAgent({ lat, lng }) {
  let { data, source, confidence } = await fortyguard.createHeatmap({ lat, lng, thresholdC: THRESHOLD_C });
  let validation = validateHeat(data, THRESHOLD_C);

  // one retry if validation itself fails (data came back live but malformed)
  if (!validation.ok && source.startsWith("live")) {
    const retry = await fortyguard.createHeatmap({ lat, lng, thresholdC: THRESHOLD_C });
    data = retry.data;
    source = retry.source;
    confidence = retry.confidence;
    validation = validateHeat(data, THRESHOLD_C);
  }

  return {
    agent: "heat",
    data,
    source,
    confidence,
    unavailable: !validation.ok,
    errors: validation.errors,
  };
}

module.exports = { runHeatAgent };
