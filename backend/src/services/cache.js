// Simple in-memory TTL cache. Swap for Redis later without touching callers.
const store = new Map();

function keyFor(agent, lat, lng, extra = "") {
  const rlat = Number(lat).toFixed(3);
  const rlng = Number(lng).toFixed(3);
  return `${agent}:${rlat}:${rlng}:${extra}`;
}

function get(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs, cachedAt: Date.now() });
}

// last-known-good, ignores TTL — used as fallback when live + retry both fail
function getStale(key, maxAgeMs) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.cachedAt > maxAgeMs) return null;
  return hit.value;
}

module.exports = { keyFor, get, set, getStale };
