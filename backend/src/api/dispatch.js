const { Router } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const flightService = require('../services/flightService');
const notamService = require('../services/notamService');
const weatherService = require('../services/weatherService');
const { authenticate, requireDispatcher } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');
const { HTTP_STATUS } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../middleware/logger');

const router = Router();

// ─── Auth endpoints ───────────────────────────────────────────────────────────

/**
 * POST /api/dispatch/auth/register
 * Register a new user (admin action in production; open in dev for convenience).
 */
router.post('/auth/register', validate(registerSchema), async (req, res, next) => {
  try {
    const existing = await User.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }],
    });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json(errorResponse('Username or email already in use.'));
    }

    const user = await User.create(req.body);
    const token = signToken(user._id);
    logger.info(`New user registered: ${user.username} (${user.role})`);
    res.status(HTTP_STATUS.CREATED).json(
      successResponse({ token, user: sanitiseUser(user) }, 'Registration successful.')
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dispatch/auth/login
 * Authenticate a user and return a signed JWT.
 */
router.post('/auth/login', validate(loginSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse('Invalid email or password.'));
    }
    if (!user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse('Account is deactivated.'));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    logger.info(`User logged in: ${user.username}`);
    res.json(successResponse({ token, user: sanitiseUser(user) }, 'Login successful.'));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dispatch/auth/me
 * Return the authenticated user's profile.
 */
router.get('/auth/me', authenticate, (req, res) => {
  res.json(successResponse(sanitiseUser(req.user), 'User profile retrieved.'));
});

// ─── Dispatch operations ─────────────────────────────────────────────────────

/**
 * GET /api/dispatch/briefing/:flightId
 * Full dispatch briefing: flight details + weather + NOTAMs.
 */
router.get('/briefing/:flightId', authenticate, async (req, res, next) => {
  try {
    const flight = await flightService.getFlightById(req.params.flightId);
    if (!flight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse('Flight not found.'));
    }

    const [weatherData, notamData] = await Promise.allSettled([
      Promise.all([
        weatherService.getStationWeather(flight.departure.icao),
        weatherService.getStationWeather(flight.destination.icao),
      ]),
      notamService.getNotamsForFlight(flight),
    ]);

    const weather = weatherData.status === 'fulfilled'
      ? { departure: weatherData.value[0], destination: weatherData.value[1] }
      : { error: weatherData.reason?.message };

    const notams = notamData.status === 'fulfilled' ? notamData.value : { error: notamData.reason?.message };

    res.json(
      successResponse({ flight, weather, notams }, 'Dispatch briefing generated.')
    );
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dispatch/summary
 * High-level operational summary for the dispatch board.
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const summary = await flightService.getOperationalSummary();
    res.json(successResponse(summary, 'Dispatch summary retrieved.'));
  } catch (err) {
    next(err);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitiseUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.passwordChangedAt;
  return obj;
}

module.exports = router;
