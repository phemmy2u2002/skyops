/**
 * Application-wide constants for the SkyOps platform.
 */

const FLIGHT_STATUSES = Object.freeze({
  SCHEDULED: 'scheduled',
  BOARDING: 'boarding',
  DEPARTED: 'departed',
  AIRBORNE: 'airborne',
  LANDED: 'landed',
  ARRIVED: 'arrived',
  DELAYED: 'delayed',
  CANCELLED: 'cancelled',
  DIVERTED: 'diverted',
});

const USER_ROLES = Object.freeze({
  PILOT: 'pilot',
  DISPATCHER: 'dispatcher',
  ADMIN: 'admin',
});

const AIRCRAFT_TYPES = Object.freeze({
  // Narrow-body jets
  A319: 'Airbus A319',
  A320: 'Airbus A320',
  A321: 'Airbus A321',
  B737: 'Boeing 737',
  B738: 'Boeing 737-800',
  B739: 'Boeing 737-900',
  // Wide-body jets
  A330: 'Airbus A330',
  A350: 'Airbus A350',
  A380: 'Airbus A380',
  B767: 'Boeing 767',
  B777: 'Boeing 777',
  B787: 'Boeing 787 Dreamliner',
  // Regional / turboprop
  AT72: 'ATR 72',
  DH8D: 'De Havilland Dash 8-400',
  E175: 'Embraer 175',
  E190: 'Embraer 190',
  CRJ9: 'Bombardier CRJ-900',
});

const CREW_ROLES = Object.freeze({
  CAPTAIN: 'captain',
  FIRST_OFFICER: 'first_officer',
  FLIGHT_ENGINEER: 'flight_engineer',
  PURSER: 'purser',
  CABIN_CREW: 'cabin_crew',
});

const NOTAM_CATEGORIES = Object.freeze({
  AIRSPACE: 'airspace',
  AIRPORT: 'airport',
  NAVIGATION: 'navigation',
  OBSTACLE: 'obstacle',
  PROCEDURE: 'procedure',
  WARNING: 'warning',
  OTHER: 'other',
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
});

const PAGINATION_DEFAULTS = Object.freeze({
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
});

module.exports = {
  FLIGHT_STATUSES,
  USER_ROLES,
  AIRCRAFT_TYPES,
  CREW_ROLES,
  NOTAM_CATEGORIES,
  HTTP_STATUS,
  PAGINATION_DEFAULTS,
};
