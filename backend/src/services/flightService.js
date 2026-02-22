const Flight = require('../models/Flight');
const { FLIGHT_STATUSES, PAGINATION_DEFAULTS } = require('../utils/constants');
const { parsePagination, calculateFlightDuration } = require('../utils/helpers');
const logger = require('../middleware/logger');

/**
 * Retrieve a paginated, filtered list of flights.
 * @param {object} query  req.query (already validated)
 */
async function listFlights(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.departureIcao) filter['departure.icao'] = query.departureIcao.toUpperCase();
  if (query.destinationIcao) filter['destination.icao'] = query.destinationIcao.toUpperCase();
  if (query.flightNumber) filter.flightNumber = new RegExp(query.flightNumber, 'i');

  if (query.date) {
    const day = new Date(query.date);
    const nextDay = new Date(day);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    filter.departureTime = { $gte: day, $lt: nextDay };
  }

  const [flights, total] = await Promise.all([
    Flight.find(filter)
      .sort({ departureTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('dispatchedBy', 'username profile.firstName profile.lastName')
      .lean({ virtuals: true }),
    Flight.countDocuments(filter),
  ]);

  return {
    flights,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single flight by its MongoDB _id.
 * @param {string} id
 */
async function getFlightById(id) {
  const flight = await Flight.findById(id)
    .populate('dispatchedBy', 'username profile.firstName profile.lastName')
    .lean({ virtuals: true });
  return flight;
}

/**
 * Create a new flight record.
 * @param {object} flightData  Validated request body
 * @param {object} user        Authenticated user
 */
async function createFlight(flightData, user) {
  const flight = await Flight.create({
    ...flightData,
    dispatchedBy: user._id,
  });
  logger.info(`Flight created: ${flight.flightNumber} by user ${user.username}`);
  return flight.toObject({ virtuals: true });
}

/**
 * Update an existing flight.
 * @param {string} id
 * @param {object} updateData  Validated request body
 * @param {object} user        Authenticated user
 */
async function updateFlight(id, updateData, user) {
  const flight = await Flight.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });

  if (flight) {
    logger.info(`Flight updated: ${flight.flightNumber} (${id}) by user ${user.username}`);
  }
  return flight;
}

/**
 * Delete a flight record.
 * @param {string} id
 * @param {object} user  Authenticated user
 */
async function deleteFlight(id, user) {
  const flight = await Flight.findByIdAndDelete(id).lean();
  if (flight) {
    logger.info(`Flight deleted: ${flight.flightNumber} (${id}) by user ${user.username}`);
  }
  return flight;
}

/**
 * Update the status of a flight.
 * @param {string} id
 * @param {string} status   One of FLIGHT_STATUSES values
 * @param {object} user
 */
async function updateFlightStatus(id, status, user) {
  if (!Object.values(FLIGHT_STATUSES).includes(status)) {
    throw Object.assign(new Error(`Invalid flight status: ${status}`), { statusCode: 400 });
  }
  return updateFlight(id, { status }, user);
}

/**
 * Add a crew member to a flight.
 * @param {string} flightId
 * @param {object} crewMember  { name, role, licenseNumber?, userId? }
 * @param {object} user
 */
async function addCrewMember(flightId, crewMember, user) {
  const flight = await Flight.findByIdAndUpdate(
    flightId,
    { $push: { crew: crewMember } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });

  if (flight) {
    logger.info(`Crew member added to flight ${flight.flightNumber} by ${user.username}`);
  }
  return flight;
}

/**
 * Get a brief operational summary of all active flights.
 */
async function getOperationalSummary() {
  const statusCounts = await Flight.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const todayCount = await Flight.countDocuments({
    departureTime: { $gte: today, $lt: tomorrow },
  });

  return { statusCounts, todayCount };
}

module.exports = {
  listFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
  updateFlightStatus,
  addCrewMember,
  getOperationalSummary,
};
