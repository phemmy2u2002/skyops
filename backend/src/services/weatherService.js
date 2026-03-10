const weatherApi = require('../integrations/weatherApi');
const { parseICAO } = require('../utils/helpers');
const logger = require('../middleware/logger');

// Simple in-process cache to reduce hammering the upstream API
const cache = new Map(); // key -> { data, expiresAt }

function getCached(key) {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data, ttlSeconds = 300) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Get METAR data for a given ICAO identifier.
 * Cached for 5 minutes (METARs are typically issued every 30-60 min).
 * @param {string} icao
 * @param {{ hours?: number }} [opts]
 */
async function getMetar(icao, opts = {}) {
  const code = parseICAO(icao);
  if (!code) {
    throw Object.assign(new Error(`Invalid ICAO code: ${icao}`), { statusCode: 400 });
  }

  const cacheKey = `metar:${code}:${opts.hours || 2}`;
  const cached = getCached(cacheKey);
  if (cached) {
    logger.debug(`[WeatherService] Cache hit for ${cacheKey}`);
    return cached;
  }

  const data = await weatherApi.fetchMetar(code, opts);
  setCache(cacheKey, data, 300); // 5 min TTL
  return data;
}

/**
 * Get TAF data for a given ICAO identifier.
 * Cached for 30 minutes (TAFs are updated every 6 hours).
 * @param {string} icao
 * @param {{ hours?: number }} [opts]
 */
async function getTaf(icao, opts = {}) {
  const code = parseICAO(icao);
  if (!code) {
    throw Object.assign(new Error(`Invalid ICAO code: ${icao}`), { statusCode: 400 });
  }

  const cacheKey = `taf:${code}:${opts.hours || 24}`;
  const cached = getCached(cacheKey);
  if (cached) {
    logger.debug(`[WeatherService] Cache hit for ${cacheKey}`);
    return cached;
  }

  const data = await weatherApi.fetchTaf(code, opts);
  setCache(cacheKey, data, 1800); // 30 min TTL
  return data;
}

/**
 * Get both METAR and TAF for a station in one call.
 * @param {string} icao
 */
async function getStationWeather(icao) {
  const [metar, taf] = await Promise.allSettled([getMetar(icao), getTaf(icao)]);

  return {
    icao: icao.toUpperCase(),
    metar: metar.status === 'fulfilled' ? metar.value : null,
    taf: taf.status === 'fulfilled' ? taf.value : null,
    metarError: metar.status === 'rejected' ? metar.reason?.message : null,
    tafError: taf.status === 'rejected' ? taf.reason?.message : null,
  };
}

/**
 * Get PIREP data near a station.
 * @param {string} icao
 * @param {{ distance?: number }} [opts]
 */
async function getPirep(icao, opts = {}) {
  const code = parseICAO(icao);
  if (!code) {
    throw Object.assign(new Error(`Invalid ICAO code: ${icao}`), { statusCode: 400 });
  }

  const cacheKey = `pirep:${code}:${opts.distance || 100}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const data = await weatherApi.fetchPirep(code, opts);
  setCache(cacheKey, data, 600); // 10 min TTL
  return data;
}

/**
 * Get active SIGMETs.
 */
async function getSigmets() {
  const cached = getCached('sigmets');
  if (cached) return cached;

  const data = await weatherApi.fetchSigmet();
  setCache('sigmets', data, 600);
  return data;
}

module.exports = { getMetar, getTaf, getStationWeather, getPirep, getSigmets };
