const fortyguard = require("../services/fortyguardClient");
const { validateFinancial } = require("../lib/validators");

async function runFinancialAgent({ lat, lng }) {
  const { data, source, confidence } = await fortyguard.environmentalParameters({ lat, lng });
  const validation = validateFinancial(data);

  return {
    agent: "financial",
    data,
    source,
    confidence,
    unavailable: !validation.ok,
    errors: validation.errors,
    estimated: source === "mock",
  };
}

module.exports = { runFinancialAgent };
