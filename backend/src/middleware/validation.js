const Joi = require('joi');
const { HTTP_STATUS } = require('../utils/constants');
const { errorResponse } = require('../utils/helpers');

/**
 * Factory: returns Express middleware that validates req[source] against schema.
 * @param {Joi.Schema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .json(errorResponse('Validation failed.', errors));
    }
    req[source] = value; // replace with sanitised value
    next();
  };
}

// ─── Reusable sub-schemas ───────────────────────────────────────────────────

const icaoCode = Joi.string()
  .uppercase()
  .length(4)
  .pattern(/^[A-Z]{4}$/)
  .messages({ 'string.pattern.base': '{{#label}} must be a 4-letter ICAO code' });

const iataCode = Joi.string()
  .uppercase()
  .length(3)
  .pattern(/^[A-Z]{3}$/)
  .optional();

// ─── Flight schemas ─────────────────────────────────────────────────────────

const createFlightSchema = Joi.object({
  flightNumber: Joi.string()
    .uppercase()
    .pattern(/^[A-Z]{2,3}\d{1,4}[A-Z]?$/)
    .required()
    .messages({ 'string.pattern.base': 'flightNumber must match IATA format e.g. BA123' }),
  departure: Joi.object({
    icao: icaoCode.required(),
    iata: iataCode,
    name: Joi.string().max(100).optional(),
  }).required(),
  destination: Joi.object({
    icao: icaoCode.required(),
    iata: iataCode,
    name: Joi.string().max(100).optional(),
  }).required(),
  departureTime: Joi.date().iso().required(),
  arrivalTime: Joi.date().iso().greater(Joi.ref('departureTime')).required(),
  aircraft: Joi.object({
    registration: Joi.string().uppercase().max(10).required(),
    type: Joi.string().max(50).required(),
    icaoCode: Joi.string().uppercase().max(4).optional(),
  }).required(),
  passengers: Joi.object({
    booked: Joi.number().integer().min(0).default(0),
    checkedIn: Joi.number().integer().min(0).default(0),
    capacity: Joi.number().integer().min(1).required(),
  }).required(),
  status: Joi.string()
    .valid('scheduled', 'boarding', 'departed', 'airborne', 'landed', 'arrived', 'delayed', 'cancelled', 'diverted')
    .default('scheduled'),
  route: Joi.object({
    distance: Joi.number().min(0).optional(),
    plannedAltitude: Joi.number().min(0).optional(),
    waypoints: Joi.array().items(Joi.string().uppercase()).optional(),
  }).optional(),
  fuel: Joi.object({
    planned: Joi.number().min(0).optional(),
    actual: Joi.number().min(0).optional(),
    onBoard: Joi.number().min(0).optional(),
  }).optional(),
  remarks: Joi.string().max(1000).optional(),
});

const updateFlightSchema = createFlightSchema.fork(
  ['flightNumber', 'departure', 'destination', 'departureTime', 'arrivalTime', 'aircraft', 'passengers'],
  (field) => field.optional()
);

const flightQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid('scheduled', 'boarding', 'departed', 'airborne', 'landed', 'arrived', 'delayed', 'cancelled', 'diverted')
    .optional(),
  departureIcao: icaoCode.optional(),
  destinationIcao: icaoCode.optional(),
  date: Joi.date().iso().optional(),
  flightNumber: Joi.string().optional(),
});

// ─── Auth schemas ────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  username: Joi.string().lowercase().min(3).max(30).pattern(/^[a-z0-9_.-]+$/).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('pilot', 'dispatcher', 'admin').default('dispatcher'),
  profile: Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    licenseNumber: Joi.string().max(20).optional(),
    phone: Joi.string().max(20).optional(),
  }).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

// ─── Weather / NOTAM query schemas ──────────────────────────────────────────

const icaoParamSchema = Joi.object({
  icao: icaoCode.required(),
});

const notamQuerySchema = Joi.object({
  icao: icaoCode.optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  validate,
  createFlightSchema,
  updateFlightSchema,
  flightQuerySchema,
  registerSchema,
  loginSchema,
  icaoParamSchema,
  notamQuerySchema,
};
