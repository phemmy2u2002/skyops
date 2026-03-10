import { parseISO, isValid, isAfter } from 'date-fns';

// ─── Primitive validators ────────────────────────────────────────────────────────

/**
 * Returns true if the string is a valid 4-letter ICAO aerodrome code.
 */
export function validateIcao(icao) {
  return typeof icao === 'string' && /^[A-Z]{4}$/.test(icao.trim().toUpperCase());
}

/**
 * Returns true if the string is a valid IATA 3-letter code.
 */
export function validateIata(iata) {
  return typeof iata === 'string' && /^[A-Z]{3}$/.test(iata.trim().toUpperCase());
}

/**
 * Returns true if the string is a valid airline flight number (e.g. SKY001, BA002).
 */
export function validateFlightNumber(fn) {
  return typeof fn === 'string' && /^[A-Z]{2,3}\d{1,4}[A-Z]?$/.test(fn.trim().toUpperCase());
}

/**
 * Returns true if the string is a valid aircraft registration.
 * Accepts common formats: N-type (N12345), G-ABCD, OY-ABC etc.
 */
export function validateRegistration(reg) {
  return typeof reg === 'string' && /^[A-Z0-9]{1,2}-?[A-Z0-9]{2,5}$/.test(reg.trim().toUpperCase());
}

/**
 * Returns true if the value is a non-empty string.
 */
export function isRequired(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

/**
 * Returns true if the string is a valid ISO 8601 date/time.
 */
export function isValidDate(value) {
  if (!value) return false;
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d);
}

/**
 * Returns true if the email address matches a standard pattern.
 */
export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Form validators ─────────────────────────────────────────────────────────────

/**
 * Validate the new-flight form fields.
 *
 * @param {Object} form - Form values
 * @returns {Object} errors - Keyed by field name. Empty object means no errors.
 */
export function validateFlightForm(form) {
  const errors = {};

  if (!isRequired(form.flightNumber)) {
    errors.flightNumber = 'Flight number is required';
  } else if (!validateFlightNumber(form.flightNumber)) {
    errors.flightNumber = 'Enter a valid flight number (e.g. SKY001)';
  }

  if (!isRequired(form.originIcao)) {
    errors.originIcao = 'Origin airport is required';
  } else if (!validateIcao(form.originIcao)) {
    errors.originIcao = 'Enter a valid 4-letter ICAO code';
  }

  if (!isRequired(form.destinationIcao)) {
    errors.destinationIcao = 'Destination airport is required';
  } else if (!validateIcao(form.destinationIcao)) {
    errors.destinationIcao = 'Enter a valid 4-letter ICAO code';
  }

  if (
    isRequired(form.originIcao) &&
    isRequired(form.destinationIcao) &&
    form.originIcao.toUpperCase() === form.destinationIcao.toUpperCase()
  ) {
    errors.destinationIcao = 'Destination must differ from origin';
  }

  if (!isRequired(form.scheduledDeparture)) {
    errors.scheduledDeparture = 'Scheduled departure is required';
  } else if (!isValidDate(form.scheduledDeparture)) {
    errors.scheduledDeparture = 'Enter a valid departure date/time';
  }

  if (!isRequired(form.scheduledArrival)) {
    errors.scheduledArrival = 'Scheduled arrival is required';
  } else if (!isValidDate(form.scheduledArrival)) {
    errors.scheduledArrival = 'Enter a valid arrival date/time';
  }

  if (
    isValidDate(form.scheduledDeparture) &&
    isValidDate(form.scheduledArrival) &&
    !isAfter(parseISO(form.scheduledArrival), parseISO(form.scheduledDeparture))
  ) {
    errors.scheduledArrival = 'Arrival must be after departure';
  }

  return errors;
}

/**
 * Validate login form credentials.
 */
export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!isRequired(email)) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (!isRequired(password)) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  return errors;
}
