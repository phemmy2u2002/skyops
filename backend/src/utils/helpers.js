const { PAGINATION_DEFAULTS } = require('./constants');

/**
 * Format a Date object (or ISO string) to a human-readable UTC string.
 * @param {Date|string} date
 * @returns {string} e.g. "2024-03-15 14:30 UTC"
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

/**
 * Calculate flight duration in minutes between two Date objects / ISO strings.
 * @param {Date|string} departureTime
 * @param {Date|string} arrivalTime
 * @returns {{ hours: number, minutes: number, totalMinutes: number }|null}
 */
function calculateFlightDuration(departureTime, arrivalTime) {
  const dep = new Date(departureTime);
  const arr = new Date(arrivalTime);
  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return null;

  const totalMinutes = Math.round((arr - dep) / 60000);
  if (totalMinutes < 0) return null;

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
    formatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
  };
}

/**
 * Parse and validate an ICAO airport/location indicator.
 * Returns the uppercased code if valid, null otherwise.
 * @param {string} code
 * @returns {string|null}
 */
function parseICAO(code) {
  if (typeof code !== 'string') return null;
  const cleaned = code.trim().toUpperCase();
  // ICAO codes are 4 uppercase letters
  return /^[A-Z]{4}$/.test(cleaned) ? cleaned : null;
}

/**
 * Parse and validate an IATA airport code.
 * Returns the uppercased code if valid, null otherwise.
 * @param {string} code
 * @returns {string|null}
 */
function parseIATA(code) {
  if (typeof code !== 'string') return null;
  const cleaned = code.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(cleaned) ? cleaned : null;
}

/**
 * Build a standardised success response envelope.
 * @param {*} data
 * @param {string} [message]
 * @param {object} [meta]  pagination / extra info
 * @returns {object}
 */
function successResponse(data, message = 'Success', meta = {}) {
  return { success: true, message, data, ...meta };
}

/**
 * Build a standardised error response envelope.
 * @param {string} message
 * @param {*} [errors]
 * @returns {object}
 */
function errorResponse(message, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return body;
}

/**
 * Extract and validate pagination query params.
 * @param {object} query  req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query) {
  let page = parseInt(query.page, 10) || PAGINATION_DEFAULTS.PAGE;
  let limit = parseInt(query.limit, 10) || PAGINATION_DEFAULTS.LIMIT;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) limit = PAGINATION_DEFAULTS.MAX_LIMIT;

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Convert nautical miles to kilometres.
 * @param {number} nm
 * @returns {number}
 */
function nmToKm(nm) {
  return Math.round(nm * 1.852 * 10) / 10;
}

/**
 * Convert feet to metres.
 * @param {number} feet
 * @returns {number}
 */
function feetToMetres(feet) {
  return Math.round(feet * 0.3048);
}

module.exports = {
  formatDate,
  calculateFlightDuration,
  parseICAO,
  parseIATA,
  successResponse,
  errorResponse,
  parsePagination,
  nmToKm,
  feetToMetres,
};
