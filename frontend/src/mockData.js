// --- Initial SITES Mock Database ---
export const initialSites = [
  {
    site_id: "site_001",
    site_name: "Northgate Mall • Sector 4B",
    location: "Phoenix, AZ • High Albedo Zone",
    latitude: 33.4484,
    longitude: -112.0740,
    surface_type: "Dark Asphalt (Albedo 0.05)",
    peak_ambient_f: 114.2,
    charger_model: "ABB Terra 184 (180kW)",
    cooling_type: "Air-Cooled",
    stall_count: 8,
    utility_rate_kwh: 0.18,
    customer_price_kwh: 0.45,
    daily_sessions: 12,
    metrics: {
      thermal_siting_score: 42,
      risk_level: "CRITICAL RISK",
      annual_derating_hours: 384,
      shade_coverage_pct: 5.0,
      estimated_revenue_loss_usd: 12400.00
    },
    charts: {
      heat_dissipated_pct: 55.2,
      heat_retained_pct: 44.8,
      monthly_throttling_hours: [45, 52, 78, 92, 115, 142, 138, 95],
      efficiency_trend: [100, 98, 95, 90, 82, 70, 60, 52]
    },
    charger_nodes: [
      { station_id: "Station 11 (ID-7741-A)", max_load_kw: 11, peak_temp_f: 118, status: "Critical" },
      { station_id: "Station 12 (ID-7741-B)", max_load_kw: 7, peak_temp_f: 94, status: "Normal" },
      { station_id: "Station 13 (ID-7741-C)", max_load_kw: 11, peak_temp_f: 96, status: "Normal" }
    ]
  },
  {
    site_id: "site_002",
    site_name: "Deep Ellum Central",
    location: "Dallas, TX • Urban Heat Island",
    latitude: 32.7801,
    longitude: -96.7970,
    surface_type: "Standard Concrete (Albedo 0.35)",
    peak_ambient_f: 108.5,
    charger_model: "ABB Terra 184 (180kW)",
    cooling_type: "Air-Cooled",
    stall_count: 6,
    utility_rate_kwh: 0.15,
    customer_price_kwh: 0.42,
    daily_sessions: 10,
    metrics: {
      thermal_siting_score: 61,
      risk_level: "MEDIUM RISK",
      annual_derating_hours: 240,
      shade_coverage_pct: 10.0,
      estimated_revenue_loss_usd: 8200.00
    },
    charts: {
      heat_dissipated_pct: 68.0,
      heat_retained_pct: 32.0,
      monthly_throttling_hours: [20, 35, 50, 65, 80, 100, 95, 60],
      efficiency_trend: [100, 99, 97, 92, 88, 78, 71, 65]
    },
    charger_nodes: [
      { station_id: "Station 21 (ID-7742-A)", max_load_kw: 11, peak_temp_f: 102, status: "Warning" },
      { station_id: "Station 22 (ID-7742-B)", max_load_kw: 11, peak_temp_f: 91, status: "Normal" }
    ]
  },
  {
    site_id: "site_003",
    site_name: "Emerald Hub Marina",
    location: "Seattle, WA • High Tree Canopy",
    latitude: 47.6062,
    longitude: -122.3321,
    surface_type: "Porous Pavement (Albedo 0.40)",
    peak_ambient_f: 92.4,
    charger_model: "ABB Terra 184 (180kW)",
    cooling_type: "Liquid-Cooled",
    stall_count: 4,
    utility_rate_kwh: 0.12,
    customer_price_kwh: 0.38,
    daily_sessions: 8,
    metrics: {
      thermal_siting_score: 89,
      risk_level: "OPTIMAL",
      annual_derating_hours: 32,
      shade_coverage_pct: 35.0,
      estimated_revenue_loss_usd: 1100.00
    },
    charts: {
      heat_dissipated_pct: 92.0,
      heat_retained_pct: 8.0,
      monthly_throttling_hours: [2, 4, 8, 12, 18, 25, 20, 10],
      efficiency_trend: [100, 100, 99, 98, 96, 92, 90, 89]
    },
    charger_nodes: [
      { station_id: "Station 31 (ID-7743-A)", max_load_kw: 11, peak_temp_f: 84, status: "Normal" }
    ]
  },
  {
    site_id: "site_004",
    site_name: "Vegas Strip South",
    location: "Las Vegas, NV • Extreme Albedo",
    latitude: 36.1699,
    longitude: -115.1398,
    surface_type: "Dark Asphalt (Albedo 0.05)",
    peak_ambient_f: 118.9,
    charger_model: "ABB Terra 184 (180kW)",
    cooling_type: "Air-Cooled",
    stall_count: 12,
    utility_rate_kwh: 0.22,
    customer_price_kwh: 0.49,
    daily_sessions: 15,
    metrics: {
      thermal_siting_score: 12,
      risk_level: "CRITICAL RISK",
      annual_derating_hours: 580,
      shade_coverage_pct: 2.0,
      estimated_revenue_loss_usd: 28900.00
    },
    charts: {
      heat_dissipated_pct: 25.0,
      heat_retained_pct: 75.0,
      monthly_throttling_hours: [65, 80, 110, 140, 180, 210, 205, 150],
      efficiency_trend: [100, 95, 88, 75, 60, 42, 30, 22]
    },
    charger_nodes: [
      { station_id: "Station 41 (ID-7744-A)", max_load_kw: 11, peak_temp_f: 124, status: "Critical" },
      { station_id: "Station 42 (ID-7744-B)", max_load_kw: 11, peak_temp_f: 120, status: "Critical" }
    ]
  }
];

// --- Simulate Mitigation Math Engine ---
export function simulateMitigations(site, mitigations) {
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

// --- Chatbot Copilot Database ---
export const COPILOT_RESPONSES = [
  {
    keywords: ["canopy", "solar", "shade"],
    response: "Installing a Solar PV Canopy blocks direct UV load on charger cabinets. In high-power cabinets (e.g. 180kW+), shading decreases internal core heat by ~12°F, preventing 90% of mid-day power curtailments."
  },
  {
    keywords: ["asphalt", "paint", "pavement"],
    response: "Standard dark asphalt has a low albedo (~0.05) and acts as a heat battery. Applying cool reflective coating reflects 80% of solar radiation, cooling the microclimate around chargers by roughly 3-5°F."
  },
  {
    keywords: ["derating", "throttle", "slowdown"],
    response: "Thermal derating triggers when ambient air hits 95°F (35°C). The ABB Terra cabinets automatically reduce current output by up to 50% to prevent component breakdown, which doubles vehicle dwell times."
  },
  {
    keywords: ["nevi", "uptime", "grant"],
    response: "The NEVI program requires 97% charger uptime. Under section 6.2, state DOTs can reject funding claims if telemetry logs show excessive thermal shutdowns. Shading is highly recommended to qualify for resilience credits."
  }
];

export function getCopilotResponse(query) {
  const normalized = query.toLowerCase();
  for (const resp of COPILOT_RESPONSES) {
    if (resp.keywords.some(kw => normalized.includes(kw))) {
      return resp.response;
    }
  }
  return "I can analyze siting hazards, thermal derating parameters, solar canopies, or NEVI compliance rules. Try asking about 'solar canopies' or 'asphalt heat island effects'.";
}
