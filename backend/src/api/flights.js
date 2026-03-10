const { Router } = require('express');
const flightService = require('../services/flightService');
const { authenticate, requireDispatcher } = require('../middleware/auth');
const { validate, createFlightSchema, updateFlightSchema, flightQuerySchema } = require('../middleware/validation');
const { HTTP_STATUS } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = Router();

// All flight routes require authentication
router.use(authenticate);

/**
 * GET /api/flights
 * List flights with optional filtering and pagination.
 */
router.get(
  '/',
  validate(flightQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await flightService.listFlights(req.query);
      res.json(successResponse(result.flights, 'Flights retrieved successfully.', { pagination: result.pagination }));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/flights/summary
 * Operational summary of flight statuses.
 */
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await flightService.getOperationalSummary();
    res.json(successResponse(summary, 'Operational summary retrieved.'));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/flights/:id
 * Get a single flight by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const flight = await flightService.getFlightById(req.params.id);
    if (!flight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse(`Flight with id ${req.params.id} not found.`));
    }
    res.json(successResponse(flight));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/flights
 * Create a new flight. Requires dispatcher or admin role.
 */
router.post(
  '/',
  requireDispatcher,
  validate(createFlightSchema),
  async (req, res, next) => {
    try {
      const flight = await flightService.createFlight(req.body, req.user);
      res.status(HTTP_STATUS.CREATED).json(successResponse(flight, 'Flight created successfully.'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/flights/:id
 * Update an existing flight. Requires dispatcher or admin role.
 */
router.put(
  '/:id',
  requireDispatcher,
  validate(updateFlightSchema),
  async (req, res, next) => {
    try {
      const flight = await flightService.updateFlight(req.params.id, req.body, req.user);
      if (!flight) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse(`Flight with id ${req.params.id} not found.`));
      }
      res.json(successResponse(flight, 'Flight updated successfully.'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/flights/:id/status
 * Update only the status of a flight.
 */
router.patch('/:id/status', requireDispatcher, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse('status is required.'));
    }
    const flight = await flightService.updateFlightStatus(req.params.id, status, req.user);
    if (!flight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse(`Flight with id ${req.params.id} not found.`));
    }
    res.json(successResponse(flight, 'Flight status updated.'));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/flights/:id/crew
 * Add a crew member to a flight.
 */
router.post('/:id/crew', requireDispatcher, async (req, res, next) => {
  try {
    const flight = await flightService.addCrewMember(req.params.id, req.body, req.user);
    if (!flight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse(`Flight with id ${req.params.id} not found.`));
    }
    res.json(successResponse(flight, 'Crew member added.'));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/flights/:id
 * Delete a flight. Requires dispatcher or admin role.
 */
router.delete('/:id', requireDispatcher, async (req, res, next) => {
  try {
    const flight = await flightService.deleteFlight(req.params.id, req.user);
    if (!flight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse(`Flight with id ${req.params.id} not found.`));
    }
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
