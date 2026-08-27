const groq = require("../services/groqClient");

/**
 * Deterministic ranking: higher tss_score = better site (lower thermal stress risk).
 * Sites that FAILed entirely (no tss_score) go to the bottom, still included.
 */
function rankSites(siteResults) {
  const ranked = [...siteResults].sort((a, b) => {
    const aScore = typeof a.tss_score === "number" ? a.tss_score : -Infinity;
    const bScore = typeof b.tss_score === "number" ? b.tss_score : -Infinity;
    return bScore - aScore; // descending
  });

  return ranked.map((site, i) => ({ ...site, rank: i + 1 }));
}

// Optional single Groq call: short portfolio-level summary comparing the ranked sites.
// Not required for ranking itself (that's deterministic) — just adds a human-readable "why".
async function generatePortfolioSummary(rankedSites) {
  const system = `You are Voltherm's site engineer. Given a ranked list of EV charging sites (best to worst by thermal stress score), write a short 2-3 sentence summary explaining which site is the best choice and why, using only the numbers provided. Return strict JSON: { "summary": string }`;

  const user = JSON.stringify(
    rankedSites.map((s) => ({
      rank: s.rank,
      location: s.location,
      tss_score: s.tss_score,
      risk_level: s.risk_level,
      breakdown: s.breakdown,
    }))
  );

  try {
    const result = await groq.chat({ system, user, jsonMode: true, timeoutMs: 10000 });
    return result.summary;
  } catch (e) {
    return null; // graceful degradation — ranking still works without the summary
  }
}

async function runReportAgent(siteResults) {
  const ranked = rankSites(siteResults);
  const summary = await generatePortfolioSummary(ranked);

  return {
    sites: ranked,
    best_location: ranked[0]?.location || null,
    summary,
  };
}

module.exports = { runReportAgent, rankSites };
