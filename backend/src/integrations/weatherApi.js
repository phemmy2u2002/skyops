const axios = require('axios');
const logger = require('../middleware/logger');

const BASE_URL =
  process.env.AVIATION_WEATHER_BASE_URL || 'https://aviationweather.gov/api/data';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

/**
 * Fetch METAR report(s) for one or more ICAO station identifiers.
 * @param {string|string[]} icao  Single ICAO or array of ICAOs
 * @param {{ hours?: number }} [opts]
 * @returns {Promise<object[]>}
 */
async function fetchMetar(icao, opts = {}) {
  const stations = Array.isArray(icao) ? icao.join(',') : icao;
  const params = {
    ids: stations,
    format: 'json',
    hours: opts.hours || 2,
  };

  logger.info(`[WeatherAPI] Fetching METAR for ${stations}`);
  const { data } = await client.get('/metar', { params });
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch TAF (Terminal Aerodrome Forecast) for one or more ICAO station identifiers.
 * @param {string|string[]} icao
 * @param {{ hours?: number }} [opts]
 * @returns {Promise<object[]>}
 */
async function fetchTaf(icao, opts = {}) {
  const stations = Array.isArray(icao) ? icao.join(',') : icao;
  const params = {
    ids: stations,
    format: 'json',
    hours: opts.hours || 24,
  };

  logger.info(`[WeatherAPI] Fetching TAF for ${stations}`);
  const { data } = await client.get('/taf', { params });
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch PIREPs (Pilot Reports) within a radius of an ICAO station.
 * @param {string} icao
 * @param {{ distance?: number }} [opts]  distance in nautical miles
 * @returns {Promise<object[]>}
 */
async function fetchPirep(icao, opts = {}) {
  const params = {
    id: icao,
    format: 'json',
    distance: opts.distance || 100,
  };

  logger.info(`[WeatherAPI] Fetching PIREP near ${icao}`);
  const { data } = await client.get('/pirep', { params });
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch SIGMET/AIRMET data (all active by default).
 * @returns {Promise<object[]>}
 */
async function fetchSigmet() {
  logger.info('[WeatherAPI] Fetching active SIGMETs');
  const { data } = await client.get('/sigmet', { params: { format: 'json' } });
  return Array.isArray(data) ? data : [];
}

module.exports = { fetchMetar, fetchTaf, fetchPirep, fetchSigmet };
