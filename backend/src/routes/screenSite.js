const express = require("express");
const router = express.Router();
const { runSitePipeline } = require("../agents/pipeline");
const { runReportAgent } = require("../agents/reportAgent");

const MAX_SITES = 4;

// ---- Single site (unchanged behavior, now backed by shared pipeline.js) ----
router.post("/screen-site", async (req, res, next) => {
  try {
    const { lat, lng, address, polygon_aoi: polygonAoi } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng (numbers) are required" });
    }
    const result = await runSitePipeline({ lat, lng, address, polygonAoi });
    const { location, ...rest } = result; // keep single-site response shape unchanged
    return res.json(rest);
  } catch (err) {
    next(err);
  }
});

// ---- Multi-site (new): array in, ranked report out ----
router.post("/screen-sites", async (req, res, next) => {
  try {
    const { lats, lngs, addresses, count } = req.body;

    if (!Array.isArray(lats) || !Array.isArray(lngs)) {
      return res.status(400).json({ error: "lats and lngs must be arrays" });
    }
    if (lats.length !== lngs.length) {
      return res.status(400).json({ error: "lats and lngs must be the same length" });
    }
    if (typeof count === "number" && count !== lats.length) {
      return res.status(400).json({ error: "count does not match lats/lngs length" });
    }
    if (lats.length === 0) {
      return res.status(400).json({ error: "at least 1 location is required" });
    }
    if (lats.length > MAX_SITES) {
      return res.status(400).json({ error: `maximum ${MAX_SITES} locations allowed, got ${lats.length}` });
    }
    if (lats.some((v) => typeof v !== "number") || lngs.some((v) => typeof v !== "number")) {
      return res.status(400).json({ error: "all lats/lngs must be numbers" });
    }

    const startedAt = Date.now();

    // run every site's full pipeline (3 employee agents + manager + critique) in parallel
    const siteResults = await Promise.all(
      lats.map((lat, i) =>
        runSitePipeline({ lat, lng: lngs[i], address: addresses?.[i] })
      )
    );

    const report = await runReportAgent(siteResults);

    return res.json({
      ...report,
      total_sites: siteResults.length,
      latency_ms: Date.now() - startedAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
