import { format, formatDuration as dfFormatDuration, intervalToDuration, isValid, parseISO } from 'date-fns';

// ─── Date / Time ────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string or Date to UTC time string (HH:mm).
 * Returns '—' for null/invalid values.
 */
export function formatUTC(dateInput) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '—';
  return format(date, 'HHmm');
}

/**
 * Format a date to a full UTC datetime string: "dd MMM yyyy HH:mm"
 */
export function formatUTCFull(dateInput) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '—';
  return format(date, 'dd MMM yyyy HH:mm') + 'Z';
}

/**
 * Format a local date/time for display (browser timezone).
 */
export function formatLocal(dateInput, fmt = 'dd MMM HH:mm') {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '—';
  return format(date, fmt);
}

/**
 * Compute and format duration between two dates.
 * Returns a string like "2h 35m" or "—" if either date is invalid.
 */
export function formatDuration(from, to) {
  if (!from || !to) return '—';
  const start = typeof from === 'string' ? parseISO(from) : from;
  const end = typeof to === 'string' ? parseISO(to) : to;
  if (!isValid(start) || !isValid(end) || end <= start) return '—';
  const dur = intervalToDuration({ start, end });
  return dfFormatDuration(dur, { format: ['hours', 'minutes'], zero: false }) || '< 1 min';
}

/**
 * Return elapsed percentage (0-100) of a flight given departure and arrival times.
 */
export function flightProgress(departure, arrival) {
  if (!departure || !arrival) return 0;
  const dep = typeof departure === 'string' ? parseISO(departure) : departure;
  const arr = typeof arrival === 'string' ? parseISO(arrival) : arrival;
  const now = Date.now();
  const total = arr - dep;
  if (total <= 0) return 0;
  const elapsed = now - dep;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// ─── Flight / Aviation ──────────────────────────────────────────────────────────

/**
 * Convert feet to flight level string. e.g. 35000 → "FL350"
 */
export function feetToFL(feet) {
  if (feet == null) return '—';
  return `FL${Math.round(feet / 100)}`;
}

/**
 * Convert meters to feet.
 */
export function metersToFeet(m) {
  return Math.round(m * 3.28084);
}

/**
 * Format distance in nautical miles.
 */
export function formatDistance(nm) {
  if (nm == null) return '—';
  return `${Math.round(nm)} NM`;
}

/**
 * Format fuel quantity.
 */
export function formatFuel(kg, unit = 'kg') {
  if (kg == null) return '—';
  if (unit === 'lbs') return `${Math.round(kg * 2.20462).toLocaleString()} lbs`;
  return `${Math.round(kg).toLocaleString()} kg`;
}

/**
 * Format a speed value in knots.
 */
export function formatSpeed(knots) {
  if (knots == null) return '—';
  return `${Math.round(knots)} kt`;
}

// ─── Wind ────────────────────────────────────────────────────────────────────────

/**
 * Format a wind observation: "270/15G25kt" or "CALM"
 */
export function formatWind(direction, speed, gust) {
  if (!speed && speed !== 0) return '—';
  if (speed === 0) return 'CALM';
  const dir = String(direction).padStart(3, '0');
  const gustPart = gust ? `G${gust}` : '';
  return `${dir}°/${speed}${gustPart}kt`;
}

// ─── ICAO ────────────────────────────────────────────────────────────────────────

/**
 * Uppercase and trim an ICAO code for consistent display.
 */
export function normalizeIcao(icao) {
  return (icao ?? '').trim().toUpperCase();
}
