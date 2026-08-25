/**
 * db/sites.js — site storage.
 *
 * DUMMY IMPLEMENTATION: an in-memory Map. This is enough to demo the full
 * request/response cycle and survives for the life of the server process,
 * but resets on restart.
 *
 * TODO(db): swap this module for a real SQLite (better-sqlite3 / Prisma) or
 * Supabase-backed implementation. Keep the exported function signatures
 * identical (createSite, getSite, listSites) so nothing else in the app has
 * to change.
 */

import { nanoid } from 'nanoid';

/** @type {Map<string, object>} */
const sites = new Map();

export function createSite(data) {
  const id = nanoid(10);
  const record = {
    id,
    createdAt: new Date().toISOString(),
    ...data,
  };
  sites.set(id, record);
  return record;
}

export function getSite(id) {
  return sites.get(id) || null;
}

export function updateSite(id, patch) {
  const existing = sites.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  sites.set(id, updated);
  return updated;
}

export function listSites({ limit = 50 } = {}) {
  return Array.from(sites.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export default { createSite, getSite, updateSite, listSites };
