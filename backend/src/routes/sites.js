const express = require('express');
const router = express.Router();
const db = require('../database');

// --- Helper: Simulate Mitigations Engine ---
function calculateMitigations(site, mitigations) {
  const originalTss = site.metrics.thermal_siting_score;
  const originalLoss = site.metrics.estimated_revenue_loss_usd;

  let reductionMultiplier = 1.0;
  mitigations.forEach(mit => {
    if (mit.type === "Solar Canopy") {
      reductionMultiplier *= 0.45; // 55% reduction
    } else if (mit.type === "Cool Reflective Paint") {
      reductionMultiplier *= 0.72; // 28% reduction
    } else if (mit.type === "Live Tree Wall") {
      reductionMultiplier *= 0.85; // 15% reduction
    } else if (mit.type === "Liquid-Cooled Cable Retrofit") {
      reductionMultiplier *= 0.80; // 20% reduction
    }
  });

  const simulatedTss = Math.min(100, Math.max(0, Math.round(100 - ((100 - originalTss) * reductionMultiplier))));
  const simulatedLoss = Math.round(originalLoss * reductionMultiplier);
  const annualSavings = Math.round(originalLoss - simulatedLoss);
  const deratingHoursAfter = Math.round(site.metrics.annual_derating_hours * reductionMultiplier);
  const impactPct = Math.round((1.0 - reductionMultiplier) * 100);

  return {
    tss_after: simulatedTss,
    annual_revenue_loss_after_usd: simulatedLoss,
    annual_savings_usd: annualSavings,
    derating_hours_after: deratingHoursAfter,
    impact_pct: impactPct
  };
}

// 1. GET /api/sites -> List all sites + portfolio summary
router.get('/', (req, res) => {
  try {
    const sites = db.getAllSites();
    const summary = db.getPortfolioSummary();
    return res.json({
      summary,
      count: sites.length,
      sites
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/sites/:id -> Get single site by ID
router.get('/:id', (req, res) => {
  try {
    const site = db.getSiteById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: `Site with ID ${req.params.id} not found` });
    }
    return res.json(site);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/sites -> Create / Screen a new site from Setup Wizard
router.post('/', (req, res) => {
  try {
    const {
      site_name,
      location,
      latitude,
      longitude,
      surface_type,
      charger_model,
      cooling_type,
      stall_count,
      utility_rate_kwh,
      customer_price_kwh,
      daily_sessions
    } = req.body;

    if (!site_name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'site_name, latitude, and longitude are required' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const stalls = Number(stall_count || 8);
    const utility = Number(utility_rate_kwh || 0.15);
    const customer = Number(customer_price_kwh || 0.45);
    const sessions = Number(daily_sessions || 10);
    const isLiquid = cooling_type === 'Liquid-Cooled';
    const isDarkAsphalt = (surface_type || '').toLowerCase().includes('asphalt');

    // Estimate micro-climate TSS based on thermal parameters
    let baseTss = 70;
    if (lat < 35) baseTss -= 20; // southern extreme sun
    if (isDarkAsphalt) baseTss -= 18; // low albedo penalty
    if (!isLiquid) baseTss -= 14; // air-cooled derating penalty
    if (stalls > 8) baseTss -= 6; // high thermal density
    const tssScore = Math.max(12, Math.min(96, Math.round(baseTss)));

    const riskLevel = tssScore < 50 ? 'CRITICAL RISK' : (tssScore < 75 ? 'MEDIUM RISK' : 'OPTIMAL');
    const annualDeratingHours = Math.round((100 - tssScore) * 5.8);
    const revenueLoss = Math.round(annualDeratingHours * stalls * (customer - utility) * 6.5);

    const siteId = `site_${Date.now().toString().slice(-4)}`;

    const newSite = {
      site_id: siteId,
      site_name,
      location: location || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° W`,
      latitude: lat,
      longitude: lng,
      surface_type: surface_type || 'Dark Asphalt (Albedo 0.05)',
      peak_ambient_f: lat < 35 ? 112.5 : 94.2,
      charger_model: charger_model || 'ABB Terra 184 (180kW)',
      cooling_type: cooling_type || 'Air-Cooled',
      stall_count: stalls,
      utility_rate_kwh: utility,
      customer_price_kwh: customer,
      daily_sessions: sessions,
      metrics: {
        thermal_siting_score: tssScore,
        risk_level: riskLevel,
        annual_derating_hours: annualDeratingHours,
        shade_coverage_pct: 6.0,
        estimated_revenue_loss_usd: revenueLoss
      },
      charts: {
        heat_dissipated_pct: Math.max(15, tssScore),
        heat_retained_pct: Math.min(85, 100 - tssScore),
        monthly_throttling_hours: [
          Math.round(annualDeratingHours * 0.05),
          Math.round(annualDeratingHours * 0.08),
          Math.round(annualDeratingHours * 0.12),
          Math.round(annualDeratingHours * 0.18),
          Math.round(annualDeratingHours * 0.25),
          Math.round(annualDeratingHours * 0.20),
          Math.round(annualDeratingHours * 0.09),
          Math.round(annualDeratingHours * 0.03)
        ],
        efficiency_trend: [100, 97, 93, 88, 78, 64, 52, 45]
      },
      charger_nodes: Array.from({ length: Math.min(stalls, 4) }).map((_, i) => ({
        station_id: `Station ${i + 1} (${siteId.toUpperCase()}-${String.fromCharCode(65 + i)})`,
        max_load_kw: charger_model && charger_model.includes('350') ? 350 : 180,
        peak_temp_f: tssScore < 50 ? 118 : 92,
        status: tssScore < 50 ? 'Critical' : 'Normal'
      }))
    };

    // Save to SQLite
    db.saveSite(newSite);

    return res.status(201).json(newSite);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/sites/:id/mitigations -> Apply and persist mitigation design
router.put('/:id/mitigations', (req, res) => {
  try {
    const site = db.getSiteById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: `Site ${req.params.id} not found` });
    }

    const { mitigations } = req.body;
    if (!Array.isArray(mitigations)) {
      return res.status(400).json({ error: 'mitigations array is required' });
    }

    const sim = calculateMitigations(site, mitigations);

    const updatedSite = {
      ...site,
      active_mitigations: mitigations,
      metrics: {
        ...site.metrics,
        thermal_siting_score: sim.tss_after,
        estimated_revenue_loss_usd: sim.annual_revenue_loss_after_usd,
        annual_derating_hours: sim.derating_hours_after,
        annual_savings_usd: sim.annual_savings_usd,
        risk_level: sim.tss_after < 50 ? "CRITICAL RISK" : (sim.tss_after < 75 ? "MEDIUM RISK" : "OPTIMAL")
      }
    };

    db.saveSite(updatedSite);

    return res.json({
      site: updatedSite,
      mitigation_impact: sim
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/sites/:id/simulate-mitigations -> Dry-run calculation
router.post('/:id/simulate-mitigations', (req, res) => {
  try {
    const site = db.getSiteById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: `Site ${req.params.id} not found` });
    }

    const { mitigations } = req.body;
    const sim = calculateMitigations(site, Array.isArray(mitigations) ? mitigations : []);
    return res.json(sim);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. DELETE /api/sites/:id -> Delete a site
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteSite(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: `Site ${req.params.id} not found` });
    }
    return res.json({ success: true, message: `Site ${req.params.id} deleted` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
