const { runManager, generateRecommendation } = require("./manager");
const { runCritiqueAgent, buildDegradedResponse } = require("./critiqueAgent");

/**
 * Runs the full pipeline for ONE site: dispatch 3 employee agents,
 * validate, TSS calc, recommendation, critique, one bounded revision loop.
 * Used by both /api/screen-site (single) and /api/screen-sites (multi).
 */
async function runSitePipeline({ lat, lng, address, polygonAoi }) {
  const startedAt = Date.now();
  const managerOutput = await runManager({ lat, lng, polygonAoi });

  let critique = await runCritiqueAgent({ managerOutput });

  if (critique.verdict === "REVISE") {
    const revised = await generateRecommendation({
      tssResult: managerOutput.tssResult,
      heat: managerOutput.heatResult.data,
      shade: managerOutput.shadeResult.data,
      financial: managerOutput.financialResult.data,
      coherenceNotes: managerOutput.coherenceNotes,
      revisionContext: `Previous attempt failed checks: ${critique.failed_checks.join(", ")}. Reason: ${JSON.stringify(critique.detail?.semanticCheck?.reason || "")}`,
    });
    managerOutput.llmOutput = revised;
    critique = await runCritiqueAgent({ managerOutput });

    if (critique.verdict !== "PASS") {
      return {
        location: { lat, lng, address },
        ...buildDegradedResponse(managerOutput),
        verdict: "FAIL_AFTER_REVISION",
        failed_checks: critique.failed_checks,
        latency_ms: Date.now() - startedAt,
      };
    }
  }

  if (critique.verdict === "FAIL") {
    return {
      location: { lat, lng, address },
      ...critique.final,
      verdict: "FAIL",
      failed_checks: critique.failed_checks,
      latency_ms: Date.now() - startedAt,
    };
  }

  return {
    location: { lat, lng, address },
    ...critique.final,
    verdict: "PASS",
    partial_data: managerOutput.partial,
    coherence_notes: managerOutput.coherenceNotes,
    sources: {
      heat: managerOutput.heatResult.source,
      shade: managerOutput.shadeResult.source,
      financial: managerOutput.financialResult.source,
    },
    latency_ms: Date.now() - startedAt,
  };
}

module.exports = { runSitePipeline };
