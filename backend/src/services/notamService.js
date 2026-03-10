const notamApi = require('../integrations/notamApi');
const { parseICAO, parsePagination } = require('../utils/helpers');
const logger = require('../middleware/logger');

// Short-lived in-process cache (NOTAMs can change frequently)
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data, ttlSeconds = 120) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * List NOTAMs for a given ICAO location indicator.
 * @param {object} query  validated query params (icao, page, limit)
 */
async function listNotams(query = {}) {
  const { page, limit } = parsePagination(query);
  const icao = query.icao ? parseICAO(query.icao) : null;

  if (query.icao && !icao) {
    throw Object.assign(new Error(`Invalid ICAO code: ${query.icao}`), { statusCode: 400 });
  }

  if (!icao) {
    throw Object.assign(
      new Error('An ICAO location indicator is required to search NOTAMs.'),
      { statusCode: 400 }
    );
  }

  const cacheKey = `notams:${icao}:${page}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) {
    logger.debug(`[NotamService] Cache hit for ${cacheKey}`);
    return cached;
  }

  const result = await notamApi.fetchNotamsByLocation(icao, { page, limit });
  setCache(cacheKey, result, 120); // 2 min TTL
  return result;
}

/**
 * Get a single NOTAM by ID.
 * @param {string} notamId
 */
async function getNotamById(notamId) {
  const cacheKey = `notam:${notamId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const notam = await notamApi.fetchNotamById(notamId);
  if (notam) setCache(cacheKey, notam, 300);
  return notam;
}

/**
 * Retrieve NOTAMs relevant to a given flight (departure + destination).
 * @param {{ departure: { icao: string }, destination: { icao: string } }} flight
 */
async function getNotamsForFlight(flight) {
  const locations = [
    flight?.departure?.icao,
    flight?.destination?.icao,
  ].filter(Boolean);

  const results = await Promise.allSettled(
    locations.map((icao) => listNotams({ icao, page: 1, limit: 50 }))
  );

  return locations.reduce((acc, icao, idx) => {
    acc[icao] = results[idx].status === 'fulfilled' ? results[idx].value : { notams: [], error: results[idx].reason?.message };
    return acc;
  }, {});
}

module.exports = { listNotams, getNotamById, getNotamsForFlight };
