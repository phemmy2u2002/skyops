const axios = require('axios');
const logger = require('../middleware/logger');

// FAA NOTAM API  (https://notams.aim.faa.gov/notamSearch)
const BASE_URL =
  process.env.NOTAM_API_BASE_URL || 'https://external.faa.gov/fim/';
const API_KEY = process.env.NOTAM_API_KEY || '';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    ...(API_KEY ? { 'client_id': API_KEY } : {}),
  },
});

/**
 * Search NOTAMs for a given ICAO location indicator.
 * @param {string} icao  4-letter ICAO location indicator
 * @param {{ page?: number, limit?: number }} [opts]
 * @returns {Promise<{ notams: object[], total: number }>}
 */
async function fetchNotamsByLocation(icao, opts = {}) {
  const page = opts.page || 1;
  const limit = opts.limit || 20;

  logger.info(`[NotamAPI] Fetching NOTAMs for ${icao} (page ${page})`);

  // FAA FIM search endpoint
  const { data } = await client.get('notamSearch/search', {
    params: {
      searchType: 'ICAO',
      icaoLocation: icao.toUpperCase(),
      pageNum: page,
      pageSize: limit,
    },
  });

  const notams = (data?.notamList || []).map(normaliseNotam);
  const total = data?.totalNotamCount || notams.length;

  return { notams, total, page, limit };
}

/**
 * Fetch a single NOTAM by its FAA ID.
 * @param {string} notamId
 * @returns {Promise<object|null>}
 */
async function fetchNotamById(notamId) {
  logger.info(`[NotamAPI] Fetching NOTAM ${notamId}`);
  const { data } = await client.get('notamSearch/search', {
    params: { searchType: 'NOTAM_ID', notamId },
  });

  const notam = data?.notamList?.[0];
  return notam ? normaliseNotam(notam) : null;
}

/**
 * Normalise a raw FAA NOTAM object to a consistent internal shape.
 * @param {object} raw
 * @returns {object}
 */
function normaliseNotam(raw) {
  return {
    id: raw.coreNOTAMData?.notam?.id || raw.id,
    series: raw.coreNOTAMData?.notam?.series,
    number: raw.coreNOTAMData?.notam?.number,
    type: raw.coreNOTAMData?.notam?.type,
    issued: raw.coreNOTAMData?.notam?.issued,
    effectiveStart: raw.coreNOTAMData?.notam?.effectiveStart,
    effectiveEnd: raw.coreNOTAMData?.notam?.effectiveEnd,
    location: raw.coreNOTAMData?.notam?.location,
    affectedFIR: raw.coreNOTAMData?.notam?.affectedFIR,
    selectionCode: raw.coreNOTAMData?.notam?.selectionCode,
    traffic: raw.coreNOTAMData?.notam?.traffic,
    purpose: raw.coreNOTAMData?.notam?.purpose,
    scope: raw.coreNOTAMData?.notam?.scope,
    minimumFL: raw.coreNOTAMData?.notam?.minimumFL,
    maximumFL: raw.coreNOTAMData?.notam?.maximumFL,
    coordinates: raw.coreNOTAMData?.notam?.coordinates,
    radius: raw.coreNOTAMData?.notam?.radius,
    icaoMessage: raw.coreNOTAMData?.icaoMessage,
    traditionalMessage: raw.coreNOTAMData?.traditionalMessage,
    plainLanguage: raw.coreNOTAMData?.plainLanguage,
    classification: raw.classification,
    accountId: raw.accountId,
    lastUpdatedTimestamp: raw.lastUpdatedTimestamp,
  };
}

module.exports = { fetchNotamsByLocation, fetchNotamById, normaliseNotam };
