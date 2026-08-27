const { computeTSS } = require("../lib/tssFormula");
const { llmFallback } = require("../lib/mockData");
const groq = require("../services/groqClient");

const REQUIRED_FIELDS = ["tss_score", "risk_level", "breakdown", "recommendation", "roi_text"];

// Check 1: numeric consistency — pure recompute, no LLM
function checkNumericConsistency({ heat, shade, financial, statedTssScore }) {
  const recomputed = computeTSS({ heat, shade, financial });
  const diff = Math.abs(recomputed.tss_score - statedTssScore);
  return { pass: diff <= 2, diff, recomputed_score: recomputed.tss_score };
}

// Check 4: completeness — pure field presence check, no LLM
function checkCompleteness(output) {
  const missing = REQUIRED_FIELDS.filter((f) => output[f] === undefined || output[f] === null);
  return { pass: missing.length === 0, missing };
}

// Checks 2 & 3 (grounding + relevance) need semantic judgment -> Groq call
async function checkGroundingAndRelevance({ recommendation, roiText, heat, shade, financial, tssResult }) {
  const system = `You are a strict fact-checker for an AI-generated EV site recommendation.
Check two things and return strict JSON:
1. "grounded": true only if EVERY specific number (dollar figure, %, hours) in the recommendation/roi text traces back to a field in the provided data. If any number is fabricated, false.
2. "relevant": true only if the recommendation addresses the dominant risk driver — if canopy_pct < 30 it must mention shade/canopy; if wet_bulb_c > 26 it must mention cooling load.
Return: { "grounded": boolean, "relevant": boolean, "reason": string, "failed_checks": string[] }`;

  const user = JSON.stringify({
    recommendation,
    roi_text: roiText,
    source_data: { heat, shade, financial },
    tss_score: tssResult.tss_score,
  });

  return groq.chat({ system, user, jsonMode: true, timeoutMs: 10000 });
}

async function runCritiqueAgent({ managerOutput }) {
  const { tssResult, heatResult, shadeResult, financialResult, llmOutput, recommendationUnavailable } = managerOutput;

  if (recommendationUnavailable) {
    return {
      verdict: "FAIL",
      failed_checks: ["recommendation_generation_failed"],
      final: buildDegradedResponse(managerOutput),
    };
  }

  const output = {
    tss_score: tssResult.tss_score,
    risk_level: tssResult.risk_level,
    breakdown: tssResult.breakdown,
    recommendation: llmOutput.recommendation,
    roi_text: llmOutput.roi_text,
  };

  const numericCheck = checkNumericConsistency({
    heat: heatResult.data,
    shade: shadeResult.data,
    financial: financialResult.data,
    statedTssScore: tssResult.tss_score,
  });
  const completenessCheck = checkCompleteness(output);

  let semanticCheck;
  try {
    semanticCheck = await checkGroundingAndRelevance({
      recommendation: llmOutput.recommendation,
      roiText: llmOutput.roi_text,
      heat: heatResult.data,
      shade: shadeResult.data,
      financial: financialResult.data,
      tssResult,
    });
  } catch (e) {
    // if the critique LLM call itself fails, don't silently pass — treat as REVISE-worthy
    semanticCheck = { grounded: false, relevant: false, reason: "critique LLM call failed", failed_checks: ["critique_call_failed"] };
  }

  const failedChecks = [];
  if (!numericCheck.pass) failedChecks.push("numeric_consistency");
  if (!semanticCheck.grounded) failedChecks.push("grounding");
  if (!semanticCheck.relevant) failedChecks.push("relevance");
  if (!completenessCheck.pass) failedChecks.push("completeness");

  const verdict = failedChecks.length === 0 ? "PASS" : "REVISE";

  return {
    verdict,
    failed_checks: failedChecks,
    detail: { numericCheck, completenessCheck, semanticCheck },
    final: verdict === "PASS" ? output : null,
  };
}

function buildDegradedResponse(managerOutput) {
  const { tssResult, partial } = managerOutput;
  return {
    tss_score: tssResult.tss_score,
    risk_level: tssResult.risk_level,
    breakdown: tssResult.breakdown,
    recommendation: llmFallback.recommendation,
    roi_text: llmFallback.roi_text,
    recommendation_unavailable: true,
    partial_data: partial,
  };
}

module.exports = { runCritiqueAgent, buildDegradedResponse };
