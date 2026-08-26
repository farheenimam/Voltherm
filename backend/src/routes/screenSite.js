const express = require("express");
const router = express.Router();
const { runManager, generateRecommendation } = require("../agents/manager");
const { runCritiqueAgent, buildDegradedResponse } = require("../agents/critiqueAgent");

router.post("/screen-site", async (req, res, next) => {
  const startedAt = Date.now();
  try {
    const { lat, lng, address } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng (numbers) are required" });
    }

    // Steps 2-5: dispatch, validate, TSS calc, draft recommendation
    const managerOutput = await runManager({ lat, lng });

    // Step 6: critique
    let critique = await runCritiqueAgent({ managerOutput });

    // Bounded revision loop: max 1 retry of Job 4 only, with failure reason in context
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

      // second failure -> graceful degradation, no AI text
      if (critique.verdict !== "PASS") {
        return res.json({
          ...buildDegradedResponse(managerOutput),
          verdict: "FAIL_AFTER_REVISION",
          failed_checks: critique.failed_checks,
          latency_ms: Date.now() - startedAt,
        });
      }
    }

    if (critique.verdict === "FAIL") {
      return res.json({
        ...critique.final,
        verdict: "FAIL",
        failed_checks: critique.failed_checks,
        latency_ms: Date.now() - startedAt,
      });
    }

    return res.json({
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
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
