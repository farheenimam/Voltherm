import { Router } from 'express';
import { validateScreenSiteRequest } from '../lib/validators.js';
import { screenSite } from '../agents/manager.js';
import { generateSiteReportPdf } from '../services/reportGenerator.js';
import { createSite, getSite, listSites } from '../db/sites.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/screen-site
 * Body: { siteName, address, latitude, longitude, surfaceType?, canopyCoveragePct?,
 *         nearbyStructures?, treeCoveragePct?, orientation?, estimatedChargerCount?,
 *         chargerPowerKw?, nevifunding?, regionUtilityRateUsdKwh? }
 *
 * Runs the full agent pipeline (heat -> shade -> financial -> TSS -> critique),
 * persists the result, and returns the site record with all agent output attached.
 */
router.post('/', async (req, res, next) => {
  try {
    validateScreenSiteRequest(req.body);

    const progressLog = [];
    const result = await screenSite(req.body, (step, status) => {
      progressLog.push({ step, status, at: new Date().toISOString() });
    });

    const site = createSite({
      siteName: req.body.siteName,
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      input: req.body,
      progressLog,
      ...result,
    });

    res.status(201).json(site);
  } catch (err) {
    next(err);
  }
});

/** GET /api/screen-site — list recently screened sites (for the dashboard map/scorecards). */
router.get('/', (req, res) => {
  res.json({ sites: listSites() });
});

/** GET /api/screen-site/:id — fetch a single screened site. */
router.get('/:id', (req, res, next) => {
  const site = getSite(req.params.id);
  if (!site) return next(new ApiError(404, `No site found for id "${req.params.id}"`));
  res.json(site);
});

/** GET /api/screen-site/:id/report — download the PDF report for a screened site. */
router.get('/:id/report', async (req, res, next) => {
  try {
    const site = getSite(req.params.id);
    if (!site) throw new ApiError(404, `No site found for id "${req.params.id}"`);

    const { filename, mimeType, buffer } = await generateSiteReportPdf(site);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
