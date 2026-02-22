const { Router } = require('express');
const weatherService = require('../services/weatherService');
const { authenticate } = require('../middleware/auth');
const { validate, icaoParamSchema } = require('../middleware/validation');
const { successResponse } = require('../utils/helpers');

const router = Router();

// All weather routes require authentication
router.use(authenticate);

/**
 * GET /api/weather/sigmets
 * Retrieve all currently active SIGMETs.
 * NOTE: must be declared before /:icao to avoid being shadowed.
 */
router.get('/sigmets', async (req, res, next) => {
  try {
    const data = await weatherService.getSigmets();
    res.json(successResponse(data, 'Active SIGMETs retrieved.'));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/weather/:icao
 * Retrieve the latest METAR for a given ICAO station.
 */
router.get(
  '/:icao',
  validate(icaoParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours, 10) : 2;
      const data = await weatherService.getMetar(req.params.icao, { hours });
      res.json(successResponse(data, `METAR data for ${req.params.icao.toUpperCase()}.`));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/weather/:icao/taf
 * Retrieve the TAF (Terminal Aerodrome Forecast) for a given ICAO station.
 */
router.get(
  '/:icao/taf',
  validate(icaoParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours, 10) : 24;
      const data = await weatherService.getTaf(req.params.icao, { hours });
      res.json(successResponse(data, `TAF data for ${req.params.icao.toUpperCase()}.`));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/weather/:icao/full
 * Retrieve both METAR and TAF for a given ICAO station in a single response.
 */
router.get(
  '/:icao/full',
  validate(icaoParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const data = await weatherService.getStationWeather(req.params.icao);
      res.json(successResponse(data, `Full weather data for ${req.params.icao.toUpperCase()}.`));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/weather/:icao/pirep
 * Retrieve Pilot Reports (PIREPs) near a given ICAO station.
 */
router.get(
  '/:icao/pirep',
  validate(icaoParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const distance = req.query.distance ? parseInt(req.query.distance, 10) : 100;
      const data = await weatherService.getPirep(req.params.icao, { distance });
      res.json(successResponse(data, `PIREPs near ${req.params.icao.toUpperCase()}.`));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
