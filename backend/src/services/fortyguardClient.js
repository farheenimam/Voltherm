const cache = require("./cache");
const mockData = require("../lib/mockData");

const BASE_URL = (process.env.FORTYGUARD_BASE_URL || "https://api.fortyguard.com")
	.replace(/\/+$/, "")
	.replace(/\/v1$/, "");
const KEYS = {
	heat: process.env.FORTYGUARD_API_KEY_HEAT || process.env.FORTYGUARD_API_KEY,
	shade: process.env.FORTYGUARD_API_KEY_SHADE || process.env.FORTYGUARD_API_KEY,
	financial: process.env.FORTYGUARD_API_KEY_FINANCIAL || process.env.FORTYGUARD_API_KEY,
};

console.log("=== FortyGuard key check (on server startup) ===");
console.log("BASE_URL:", BASE_URL);
console.log("heat key present:", !!KEYS.heat, KEYS.heat ? `(starts with: ${KEYS.heat.slice(0, 4)}...)` : "");
console.log("shade key present:", !!KEYS.shade, KEYS.shade ? `(starts with: ${KEYS.shade.slice(0, 4)}...)` : "");
console.log("financial key present:", !!KEYS.financial, KEYS.financial ? `(starts with: ${KEYS.financial.slice(0, 4)}...)` : "");
console.log("=================================================");
const CACHE_TTL_MS = 60 * 60 * 1000;
const STALE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function shadeMockForLocation(lat, lng) {
	const locations = Object.values(mockData.shadeByLocation);
	const match = locations.find((location) =>
		Math.abs(location.lat - lat) < 0.001 && Math.abs(location.lng - lng) < 0.001
	);
	return match || {
		satellite: {
			canopy_pct: mockData.shade.canopy_pct,
			pavement_pct: mockData.shade.pavement_pct,
			building_pct: mockData.shade.building_pct,
		},
		street_view: { ground_level_shade_pct: mockData.shade.ground_level_shade_pct },
	};
}
const STATUS_POLL_INTERVAL_MS = 1000;
const MAX_STATUS_POLLS = 20;

function pointToPolygon(lat, lng, deltaDeg = 0.0015) {
	return {
		type: "FeatureCollection",
		features: [{
	type: "Feature",
	properties: {},
	geometry: {
				type: "Polygon",
				coordinates: [[
					[lng - deltaDeg, lat - deltaDeg],
		  [lng + deltaDeg, lat - deltaDeg],
		  [lng + deltaDeg, lat + deltaDeg],
		  [lng - deltaDeg, lat + deltaDeg],
					[lng - deltaDeg, lat - deltaDeg],
				]],
			},
		}],
	};
}
async function callWithTimeout(url, options, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, { ...options, signal: controller.signal });
		if (!response.ok) throw new Error(`FortyGuard ${response.status}: ${await response.text()}`);
		return response.json();
	} finally {
		clearTimeout(timer);
	}
}

async function callActivity(url, options, timeoutMs, maxStatusPolls = MAX_STATUS_POLLS) {
	const submission = await callWithTimeout(url, options, timeoutMs);
	const activityId = submission?.data?.activity_id;
	if (!activityId) return submission;
	const statusUrl = `${BASE_URL}/v1/status/${encodeURIComponent(activityId)}`;
	for (let attempt = 0; attempt < maxStatusPolls; attempt += 1) {
		await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS));
		const response = await callWithTimeout(statusUrl, {
			method: "GET",
			headers: { "api-key": options.headers["api-key"] },
	}, timeoutMs);
	const status = response?.data?.status;
	console.log(`[FortyGuard] ${activityId} status: ${status} (${attempt + 1}/${maxStatusPolls})`);
	if (status === "Completed") {
			console.log(`[FortyGuard] COMPLETED ${activityId}:`, JSON.stringify(response.data, null, 2));
			return response.data.result || response.data;
		}
		if (status === "Failed") {
			console.error(`[FortyGuard] FAILED ${activityId}:`, JSON.stringify(response.data, null, 2));
			throw new Error(
				`FortyGuard activity ${activityId} failed: ${
					response?.data?.message || response?.data?.error || "unknown provider error"
				}`
			);
		}
	}
	throw new Error(`FortyGuard activity ${activityId} did not complete in time`);
}

function firstValue(value) {
	return Array.isArray(value) ? value[0] : value;
}

function findNumericValue(value, pattern) {
	if (!value || typeof value !== "object") return undefined;
	for (const [key, child] of Object.entries(value)) {
		if (pattern.test(key) && typeof firstValue(child) === "number") return firstValue(child);
		const nested = findNumericValue(child, pattern);
		if (nested !== undefined) return nested;
	}
	return undefined;
}

function heatmapDateRange() {
	const end = new Date();
	const start = new Date(end);
	start.setUTCDate(start.getUTCDate() - 6);
	return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10), filter_type: 4 };
}

function normalizeHeatResult(result, analyticType) {
	const tileValues = (result?.map_data?.features || [])
		.map((feature) => feature?.properties?.value)
		.filter((value) => typeof value === "number");
	const value = typeof result?.stats_data?.mean === "number"
		? result.stats_data.mean
		: tileValues.length ? tileValues.reduce((sum, tileValue) => sum + tileValue, 0) / tileValues.length : undefined;
	if (typeof value !== "number") throw new Error(`FortyGuard ${analyticType} result missing stats_data.mean and tile values`);
	return analyticType === "exceedance" ? { exceedance_hours_per_day: value } : { persistence_max_hours: value };
}

function normalizeSatelliteResult(result) {
	const segments = result?.segmentation?.segments || {};
	const normalized = {
		canopy_pct: findNumericValue(segments, /canopy|vegetation|tree/i),
		pavement_pct: findNumericValue(segments, /pavement|road|asphalt/i),
		building_pct: findNumericValue(segments, /building|structure/i),
	};
	if (Object.values(normalized).every((value) => typeof value === "number")) return normalized;
	throw new Error("FortyGuard satellite result missing expected shade fields");
}

function normalizeStreetViewResult(result) {
	const value = firstValue(result?.front?.segments?.tree);
	if (typeof value === "number") return { ground_level_shade_pct: value };
	throw new Error("FortyGuard street-view result missing tree coverage");
}

function normalizeEnvironmentalResult(result) {
	const location = result?.locations?.[0];
	if (!location) return result;
	const parameters = location.parameters || {};
	const solar = location.solar_irradiance?.clear_sky || {};
	return {
		wet_bulb_c: firstValue(parameters.wet_bulb_temperature_celsius),
	heat_index_c: firstValue(parameters.heat_index_celsius),
	ghi_w_m2: solar.ghi,
	peak_hour: result.metadata?.timestamps?.[0]?.slice(11, 16) || "14:00",
	};
}

async function fetchWithResilience({ agentName, cacheKey, fetchFn, timeoutMs, mockFallback, normalize, statusPolls }) {
	const cached = cache.get(cacheKey);
	if (cached) return { data: cached, source: "cache", confidence: "high" };
	try {
	const raw = await callActivity(fetchFn.url, fetchFn.options, timeoutMs, statusPolls);
	const data = normalize ? normalize(raw) : raw;
	cache.set(cacheKey, data, CACHE_TTL_MS);
		console.log(`[FortyGuard:${agentName}] success: ${fetchFn.url}`);
		return { data, source: "live", confidence: "high" };
	} catch (firstErr) {
	console.error(`[FortyGuard:${agentName}] first attempt failed:`, firstErr.message);
	await new Promise((resolve) => setTimeout(resolve, 1000));
	try {
	const raw = await callActivity(fetchFn.url, fetchFn.options, timeoutMs, statusPolls);
	const data = normalize ? normalize(raw) : raw;
	cache.set(cacheKey, data, CACHE_TTL_MS);
			console.log(`[FortyGuard:${agentName}] success on retry: ${fetchFn.url}`);
			return { data, source: "live-retry", confidence: "high" };
		} catch (secondErr) {
	console.error(`[FortyGuard:${agentName}] retry also failed:`, secondErr.message);
	const stale = cache.getStale(cacheKey, STALE_MAX_AGE_MS);
	if (stale) return { data: stale, source: "stale-cache", confidence: "medium" };
			console.warn(`[FortyGuard:${agentName}] falling back to MOCK data — check API key / base URL / path`);
			return { data: mockFallback, source: "mock", confidence: "low" };
		}
	}
}

function authHeaders(agentName) {
	return { "api-key": KEYS[agentName], "Content-Type": "application/json" };
}

async function createHeatmap({ lat, lng, polygonAoi, thresholdC = 35 }) {
	const request = (analyticType) => fetchWithResilience({
		agentName: "heat",
		cacheKey: cache.keyFor(`heat-${analyticType}`, lat, lng, thresholdC),
		timeoutMs: 8000,
		normalize: (result) => normalizeHeatResult(result, analyticType),
		mockFallback: analyticType === "exceedance" ? { exceedance_hours_per_day: mockData.heat.exceedance_hours_per_day } : { persistence_max_hours: mockData.heat.persistence_max_hours },
		fetchFn: {
			url: `${BASE_URL}/v1/heatmap`,
			options: {
				method: "POST",
				headers: authHeaders("heat"),
				body: JSON.stringify({
					polygon_aoi: polygonAoi || pointToPolygon(lat, lng),
					date_time: heatmapDateRange(),
					granularity: 100,
					analytic_type: analyticType,
					threshold: thresholdC,
					direction: "above",
				}),
			},
		},
	});
	const [exceedance, persistence] = await Promise.all([request("exceedance"), request("persistence")]);
	return {
		data: { ...exceedance.data, ...persistence.data, threshold_used_c: thresholdC },
		source: exceedance.source === "live" && persistence.source === "live" ? "live" : "partial",
		confidence: exceedance.confidence === "high" && persistence.confidence === "high" ? "high" : "medium",
	};
}

async function satelliteSegmentation({ lat, lng }) {
	const shadeMock = shadeMockForLocation(lat, lng);
	return fetchWithResilience({
		agentName: "shade", cacheKey: cache.keyFor("shade-sat", lat, lng), timeoutMs: 1500, statusPolls: 60,
		normalize: normalizeSatelliteResult,
		mockFallback: shadeMock.satellite,
		fetchFn: { url: `${BASE_URL}/v1/satellite`, options: { method: "POST", headers: authHeaders("shade"), body: JSON.stringify({ sat: { latitude: lat, longitude: lng }, date_time: { start_date: "2024-07-15", start_time: "14:00", filter_type: 1 }, granularity: 80 }) } },
	});
}

async function streetViewSegmentation({ lat, lng }) {
	const shadeMock = shadeMockForLocation(lat, lng);
	return fetchWithResilience({
		agentName: "shade", cacheKey: cache.keyFor("shade-street", lat, lng), timeoutMs: 1500, statusPolls: 60,
		normalize: normalizeStreetViewResult,
		mockFallback: shadeMock.street_view,
		fetchFn: { url: `${BASE_URL}/v1/streetview`, options: { method: "POST", headers: authHeaders("shade"), body: JSON.stringify({ latitude: lat, longitude: lng, vertical_angle: 10, horizontal_angle: 90, back_view: false }) } },
	});
}

async function environmentalParameters({ lat, lng }) {
	return fetchWithResilience({
		agentName: "financial", cacheKey: cache.keyFor("financial", lat, lng), timeoutMs: 6000,
		normalize: normalizeEnvironmentalResult, mockFallback: mockData.financial,
		fetchFn: { url: `${BASE_URL}/v1/env_params`, options: { method: "POST", headers: authHeaders("financial"), body: JSON.stringify({ latitude: lat, longitude: lng, temperature: 32.5, date_time: { start_date: new Date().toISOString().slice(0, 10), start_time: "14:00", filter_type: 1 } }) } },
	});
}

module.exports = { createHeatmap, satelliteSegmentation, streetViewSegmentation, environmentalParameters };