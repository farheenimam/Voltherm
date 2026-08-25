/**
 * financialAgent — translates thermal risk into dollars: derating hours,
 * downtime cost, and NEVI/uptime-SLA exposure.
 *
 * DUMMY IMPLEMENTATION. See heatAgent.js for the pattern this follows.
 */

import { getSeasonalForecast } from '../services/fortyguardClient.js';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} siteFields - sliced payload (estimatedChargerCount, chargerPowerKw, nevifunding, regionUtilityRateUsdKwh)
 * @param {object} context - optional upstream results this agent may use, e.g. { heatResult }
 * @returns {Promise<object>} financialResult — consumed by tssFormula.calculateTSS
 */
export async function runFinancialAgent(siteFields, context = {}) {
  const {
    latitude,
    longitude,
    estimatedChargerCount = 4,
    chargerPowerKw = 150,
    nevifunding = false,
    regionUtilityRateUsdKwh = 0.14,
  } = siteFields;

  await delay(900 + Math.random() * 700);

  const forecast = await getSeasonalForecast({ latitude, longitude });

  // TODO(agent): replace this block with a real Anthropic call that reasons
  // over `context.heatResult` / `context.shadeResult` (manager.js passes
  // these through) plus the FortyGuard seasonal-forecast tool to project
  // realistic revenue-at-risk and NEVI uptime-SLA exposure.

  const annualDeratingHours = forecast.totalAnnualDeratingHours;
  const lostKwhPerYear = annualDeratingHours * estimatedChargerCount * chargerPowerKw * 0.3; // assume 30% derate depth
  const estimatedRevenueLossUsd = Math.round(lostKwhPerYear * (regionUtilityRateUsdKwh * 2.2)); // rough markup on delivered energy

  return {
    agent: 'financial',
    estimatedChargerCount,
    chargerPowerKw,
    nevifunding,
    annualDeratingHours,
    monthlyBreakdown: forecast.months,
    estimatedRevenueLossUsd,
    slaRisk: annualDeratingHours / (24 * 30) > 0.03, // >3% of a month's hours at risk
    findings: [
      `Projected ${annualDeratingHours} derating hours/year across ${estimatedChargerCount} charger(s).`,
      `Estimated $${estimatedRevenueLossUsd.toLocaleString()}/yr in lost charging revenue at current utilization.`,
      nevifunding ? 'Site is NEVI-funded — uptime SLA non-compliance carries funding clawback risk.' : 'Site is not currently NEVI-funded.',
    ],
    source: 'dummy:financialAgent',
  };
}

export default { runFinancialAgent };
