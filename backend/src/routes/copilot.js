const express = require('express');
const router = express.Router();
const db = require('../database');
const groq = require('../services/groqClient');
const mockData = require('../lib/mockData');

// Fallback keyword responses if LLM fails or is unavailable
const COPILOT_KEYWORDS = [
  {
    keywords: ["canopy", "solar", "shade"],
    response: "Installing a Solar PV Canopy blocks direct UV load on charger cabinets. In high-power cabinets (e.g. 180kW+), shading decreases internal core heat by ~12°F, preventing 90% of mid-day power curtailments."
  },
  {
    keywords: ["asphalt", "paint", "pavement", "sealcoat"],
    response: "Standard dark asphalt has a low albedo (~0.05) and acts as a heat battery. Applying cool reflective coating reflects 80% of solar radiation, cooling the microclimate around chargers by roughly 3-5°F."
  },
  {
    keywords: ["derating", "throttle", "slowdown"],
    response: "Thermal derating triggers when ambient air hits 95°F (35°C). The charger cabinets automatically reduce current output by up to 50% to prevent component breakdown, which doubles vehicle dwell times."
  },
  {
    keywords: ["nevi", "uptime", "grant", "sla"],
    response: "The NEVI program mandates 97% charger uptime. Under federal rules, excessive thermal shutdowns can trigger grant penalties. Shading and liquid cooling are recognized as qualifying resilience upgrades."
  }
];

function getKeywordFallback(query) {
  const normalized = query.toLowerCase();
  for (const item of COPILOT_KEYWORDS) {
    if (item.keywords.some(k => normalized.includes(k))) {
      return item.response;
    }
  }
  return "I can analyze thermal derating risks, solar canopy sizing, albedo paint impact, or NEVI compliance rules for this site. Try asking about solar canopy ROI or cooling mechanisms.";
}

// POST /api/copilot/chat -> Ask AI Copilot with Site Context
router.post('/chat', async (req, res) => {
  try {
    const { site_id, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const site = site_id ? db.getSiteById(site_id) : null;

    let systemPrompt = `You are VoltShield AI Siting Copilot, an expert thermal resilience and EV infrastructure engineer.
Answer the user's questions about EV charging thermal siting, FortyGuard microclimate heat islands, solar canopies, cool pavements, liquid-cooling retrofits, and NEVI 97% uptime compliance.
Keep your response concise, actionable, and professional (2-3 sentences max).`;

    if (site) {
      systemPrompt += `
Current Site Context:
- Name: ${site.site_name} (${site.location})
- Coordinates: ${site.latitude}° N, ${site.longitude}° W
- Thermal Siting Score (TSS): ${site.metrics.thermal_siting_score}/100 (${site.metrics.risk_level})
- Dispensers: ${site.stall_count} stalls (${site.charger_model}, ${site.cooling_type})
- Annual Derating Hours: ${site.metrics.annual_derating_hours} hrs/yr (>35°C)
- Annual Revenue at Risk: $${site.metrics.estimated_revenue_loss_usd}
- Dominant Surface: ${site.surface_type}`;
    }

    let reply = '';

    try {
      if (process.env.GROQ_API_KEY) {
        reply = await groq.chat({
          system: systemPrompt,
          user: message,
          jsonMode: false,
          timeoutMs: 10000
        });
      } else {
        reply = getKeywordFallback(message);
      }
    } catch (llmErr) {
      console.warn('[Copilot] Groq call failed; using domain fallback:', llmErr.message);
      reply = getKeywordFallback(message);
    }

    // Persist conversation to SQLite if site_id is provided
    if (site_id) {
      try {
        db.saveChatMessage(site_id, 'user', message);
        db.saveChatMessage(site_id, 'copilot', reply);
      } catch (dbErr) {
        console.error('[Copilot] Failed to save chat to DB:', dbErr.message);
      }
    }

    return res.json({
      reply,
      sender: 'copilot',
      site_id: site_id || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/copilot/chat/:site_id -> Get Chat History
router.get('/chat/:site_id', (req, res) => {
  try {
    const history = db.getChatHistory(req.params.site_id);
    return res.json({
      site_id: req.params.site_id,
      messages: history
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
