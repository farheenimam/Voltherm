const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../voltherm.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// 1. Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    site_id TEXT PRIMARY KEY,
    site_name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    surface_type TEXT NOT NULL,
    peak_ambient_f REAL,
    charger_model TEXT NOT NULL,
    cooling_type TEXT NOT NULL,
    stall_count INTEGER NOT NULL,
    utility_rate_kwh REAL,
    customer_price_kwh REAL,
    daily_sessions INTEGER,
    tss_score REAL NOT NULL,
    risk_level TEXT NOT NULL,
    annual_derating_hours REAL NOT NULL,
    shade_coverage_pct REAL NOT NULL,
    estimated_revenue_loss_usd REAL NOT NULL,
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mitigations (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    mitigation_type TEXT NOT NULL,
    coverage_pct REAL DEFAULT 100,
    tss_gain REAL,
    capex_usd REAL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(site_id) REFERENCES sites(site_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS copilot_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(site_id) REFERENCES sites(site_id) ON DELETE CASCADE
  );
`);

// 2. Initial Seeding Dataset
const SEED_SITES = [
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

// Seed if empty
const countRow = db.prepare('SELECT count(*) as count FROM sites').get();
if (countRow.count === 0) {
  console.log('[SQLite] Seeding initial candidate sites into voltherm.db...');
  const insertStmt = db.prepare(`
    INSERT INTO sites (
      site_id, site_name, location, latitude, longitude,
      surface_type, peak_ambient_f, charger_model, cooling_type,
      stall_count, utility_rate_kwh, customer_price_kwh, daily_sessions,
      tss_score, risk_level, annual_derating_hours, shade_coverage_pct,
      estimated_revenue_loss_usd, data_json
    ) VALUES (
      @site_id, @site_name, @location, @latitude, @longitude,
      @surface_type, @peak_ambient_f, @charger_model, @cooling_type,
      @stall_count, @utility_rate_kwh, @customer_price_kwh, @daily_sessions,
      @tss_score, @risk_level, @annual_derating_hours, @shade_coverage_pct,
      @estimated_revenue_loss_usd, @data_json
    )
  `);

  const insertMany = db.transaction((sites) => {
    for (const s of sites) {
      insertStmt.run({
        site_id: s.site_id,
        site_name: s.site_name,
        location: s.location,
        latitude: s.latitude,
        longitude: s.longitude,
        surface_type: s.surface_type,
        peak_ambient_f: s.peak_ambient_f,
        charger_model: s.charger_model,
        cooling_type: s.cooling_type,
        stall_count: s.stall_count,
        utility_rate_kwh: s.utility_rate_kwh,
        customer_price_kwh: s.customer_price_kwh,
        daily_sessions: s.daily_sessions,
        tss_score: s.metrics.thermal_siting_score,
        risk_level: s.metrics.risk_level,
        annual_derating_hours: s.metrics.annual_derating_hours,
        shade_coverage_pct: s.metrics.shade_coverage_pct,
        estimated_revenue_loss_usd: s.metrics.estimated_revenue_loss_usd,
        data_json: JSON.stringify(s)
      });
    }
  });

  insertMany(SEED_SITES);
  console.log('[SQLite] Seeded 4 candidate sites.');
}

// 3. Database Data Access Layer (DAO)
function getAllSites() {
  const rows = db.prepare('SELECT data_json FROM sites ORDER BY updated_at DESC').all();
  return rows.map(r => JSON.parse(r.data_json));
}

function getSiteById(siteId) {
  const row = db.prepare('SELECT data_json FROM sites WHERE site_id = ?').get(siteId);
  return row ? JSON.parse(row.data_json) : null;
}

function saveSite(site) {
  const existing = db.prepare('SELECT site_id FROM sites WHERE site_id = ?').get(site.site_id);
  const dataJson = JSON.stringify(site);

  if (existing) {
    db.prepare(`
      UPDATE sites SET
        site_name = @site_name,
        location = @location,
        latitude = @latitude,
        longitude = @longitude,
        surface_type = @surface_type,
        peak_ambient_f = @peak_ambient_f,
        charger_model = @charger_model,
        cooling_type = @cooling_type,
        stall_count = @stall_count,
        tss_score = @tss_score,
        risk_level = @risk_level,
        annual_derating_hours = @annual_derating_hours,
        estimated_revenue_loss_usd = @estimated_revenue_loss_usd,
        data_json = @data_json,
        updated_at = CURRENT_TIMESTAMP
      WHERE site_id = @site_id
    `).run({
      site_id: site.site_id,
      site_name: site.site_name,
      location: site.location,
      latitude: site.latitude,
      longitude: site.longitude,
      surface_type: site.surface_type,
      peak_ambient_f: site.peak_ambient_f || 100,
      charger_model: site.charger_model,
      cooling_type: site.cooling_type,
      stall_count: site.stall_count,
      tss_score: site.metrics.thermal_siting_score,
      risk_level: site.metrics.risk_level,
      annual_derating_hours: site.metrics.annual_derating_hours,
      estimated_revenue_loss_usd: site.metrics.estimated_revenue_loss_usd,
      data_json: dataJson
    });
  } else {
    db.prepare(`
      INSERT INTO sites (
        site_id, site_name, location, latitude, longitude,
        surface_type, peak_ambient_f, charger_model, cooling_type,
        stall_count, utility_rate_kwh, customer_price_kwh, daily_sessions,
        tss_score, risk_level, annual_derating_hours, shade_coverage_pct,
        estimated_revenue_loss_usd, data_json
      ) VALUES (
        @site_id, @site_name, @location, @latitude, @longitude,
        @surface_type, @peak_ambient_f, @charger_model, @cooling_type,
        @stall_count, @utility_rate_kwh, @customer_price_kwh, @daily_sessions,
        @tss_score, @risk_level, @annual_derating_hours, @shade_coverage_pct,
        @estimated_revenue_loss_usd, @data_json
      )
    `).run({
      site_id: site.site_id,
      site_name: site.site_name,
      location: site.location,
      latitude: site.latitude,
      longitude: site.longitude,
      surface_type: site.surface_type,
      peak_ambient_f: site.peak_ambient_f || 100,
      charger_model: site.charger_model,
      cooling_type: site.cooling_type,
      stall_count: site.stall_count,
      utility_rate_kwh: site.utility_rate_kwh || 0.15,
      customer_price_kwh: site.customer_price_kwh || 0.45,
      daily_sessions: site.daily_sessions || 10,
      tss_score: site.metrics.thermal_siting_score,
      risk_level: site.metrics.risk_level,
      annual_derating_hours: site.metrics.annual_derating_hours,
      shade_coverage_pct: site.metrics.shade_coverage_pct || 0,
      estimated_revenue_loss_usd: site.metrics.estimated_revenue_loss_usd,
      data_json: dataJson
    });
  }

  return site;
}

function deleteSite(siteId) {
  const res = db.prepare('DELETE FROM sites WHERE site_id = ?').run(siteId);
  return res.changes > 0;
}

function getPortfolioSummary() {
  const sites = getAllSites();
  if (sites.length === 0) {
    return { total_sites: 0, avg_tss: 0, total_loss_usd: 0, critical_count: 0 };
  }

  const avgTss = Math.round(sites.reduce((acc, s) => acc + s.metrics.thermal_siting_score, 0) / sites.length);
  const totalLoss = sites.reduce((acc, s) => acc + s.metrics.estimated_revenue_loss_usd, 0);
  const criticalCount = sites.filter(s => s.metrics.thermal_siting_score < 50).length;

  return {
    total_sites: sites.length,
    avg_tss: avgTss,
    total_loss_usd: totalLoss,
    critical_count: criticalCount
  };
}

function saveChatMessage(siteId, sender, message) {
  db.prepare('INSERT INTO copilot_chats (site_id, sender, message) VALUES (?, ?, ?)').run(siteId, sender, message);
}

function getChatHistory(siteId) {
  return db.prepare('SELECT sender, message, created_at FROM copilot_chats WHERE site_id = ? ORDER BY id ASC').all(siteId);
}

module.exports = {
  db,
  getAllSites,
  getSiteById,
  saveSite,
  deleteSite,
  getPortfolioSummary,
  saveChatMessage,
  getChatHistory
};
