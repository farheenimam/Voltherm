const { runHeatAgent } = require("./heatAgent");
const { runShadeAgent } = require("./shadeAgent");
const { runFinancialAgent } = require("./financialAgent");
const { coherenceCheck } = require("../lib/validators");
const { computeTSS } = require("../lib/tssFormula");
const { llmFallback } = require("../lib/mockData");
const groq = require("../services/groqClient");

// Job 4: draft recommendation (only LLM call in the manager)
async function generateRecommendation({ tssResult, heat, shade, financial, coherenceNotes, revisionContext }) {
  const system = `You are Voltherm's site engineer. Given validated EV-charging-site heat/shade/financial data, write a short plain-English recommendation and an ROI estimate.
Rules:
- Only use numbers that appear in the provided data. Never invent a figure.
- Address the dominant risk driver: if canopy_pct < 30, you MUST talk about shade/canopy. If wet_bulb_c is high (>26C), you MUST address cooling load.
- Return strict JSON: { "recommendation": string, "roi_text": string }.`;

  const user = JSON.stringify({
    tss_score: tssResult.tss_score,
    risk_level: tssResult.risk_level,
    heat,
    shade,
    financial,
    coherence_notes: coherenceNotes,
    revision_context: revisionContext || null,
  });

  try {
    return await groq.chat({ system, user, jsonMode: true, timeoutMs: 15000 });
  } catch (e) {
    console.warn("[Manager] Groq recommendation failed; using mock fallback.");
    return llmFallback;
  }
}

async function runManager({ lat, lng, polygonAoi }) {
  // Step 2: dispatch three employee agents in parallel
  const [heatResult, shadeResult, financialResult] = await Promise.all([
    runHeatAgent({ lat, lng, polygonAoi }),
    runShadeAgent({ lat, lng }),
    runFinancialAgent({ lat, lng }),
  ]);

  const partial =
    heatResult.unavailable || shadeResult.unavailable || financialResult.unavailable;

  // Job 2: coherence check (non-blocking, just notes)
  const coherenceNotes = coherenceCheck({
    heat: heatResult.data,
    shade: shadeResult.data,
    financial: financialResult.data,
  });
  if (shadeResult.flags?.length) coherenceNotes.push(...shadeResult.flags);

  // Job 3: deterministic TSS
  const tssResult = computeTSS({
    heat: heatResult.data,
    shade: shadeResult.data,
    financial: financialResult.data,
  });

  // Job 4: LLM recommendation
  let llmOutput;
  let recommendationUnavailable = false;
  try {
    llmOutput = await generateRecommendation({
      tssResult,
      heat: heatResult.data,
      shade: shadeResult.data,
      financial: financialResult.data,
      coherenceNotes,
    });
  } catch (e) {
    llmOutput = { recommendation: null, roi_text: null };
    recommendationUnavailable = true;
  }

  return {
    tssResult,
    heatResult,
    shadeResult,
    financialResult,
    coherenceNotes,
    partial,
    llmOutput,
    recommendationUnavailable,
  };
}

module.exports = { runManager, generateRecommendation };
