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
  financial: {
    wet_bulb_c: 24.5,
    heat_index_c: 38,
    ghi_w_m2: 780,
    peak_hour: "14:00",
  },
};
