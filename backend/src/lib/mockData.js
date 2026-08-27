// Last-resort static fallback. Keeps the pipeline alive during dev / API outages.
module.exports = {
  heat: {
    exceedance_hours_per_day: 4.2,
    persistence_max_hours: 3.1,
    threshold_used_c: 35,
  },
  shade: {
    canopy_pct: 18,
    pavement_pct: 62,
    building_pct: 20,
    ground_level_shade_pct: 22,
  },
  shadeByLocation: {
    chicago: {
      lat: 41.846328,
      lng: -87.743296,
      satellite: { canopy_pct: 24, pavement_pct: 58, building_pct: 18 },
      street_view: { ground_level_shade_pct: 20 },
    },
    newYork: {
      lat: 40.7128,
      lng: -74.006,
      satellite: { canopy_pct: 18, pavement_pct: 62, building_pct: 20 },
      street_view: { ground_level_shade_pct: 6.48 },
    },
    sanFrancisco: {
      lat: 37.7749,
      lng: -122.4194,
      satellite: { canopy_pct: 31, pavement_pct: 49, building_pct: 20 },
      street_view: { ground_level_shade_pct: 14 },
    },
    austin: {
      lat: 30.2672,
      lng: -97.7431,
      satellite: { canopy_pct: 36, pavement_pct: 44, building_pct: 20 },
      street_view: { ground_level_shade_pct: 28 },
    },
    seattle: {
      lat: 47.6062,
      lng: -122.3321,
      satellite: { canopy_pct: 45, pavement_pct: 35, building_pct: 20 },
      street_view: { ground_level_shade_pct: 39 },
    },
  },
  financial: {
    wet_bulb_c: 24.5,
    heat_index_c: 38,
    ghi_w_m2: 780,
    peak_hour: "14:00",
  },
  llmFallback: {
    recommendation: "Mock recommendation: monitor heat exposure and improve shade coverage before expanding charging capacity.",
    roi_text: "Mock ROI: prioritize shaded canopy upgrades and cooling mitigation to reduce thermal stress exposure and improve uptime.",
  },
};
