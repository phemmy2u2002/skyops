const { Router } = require('express');
const notamService = require('../services/notamService');
const { authenticate } = require('../middleware/auth');
const { validate, icaoParamSchema, notamQuerySchema } = require('../middleware/validation');
const { HTTP_STATUS } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = Router();

// All NOTAM routes require authentication
router.use(authenticate);

/**
 * GET /api/notams
 * Search NOTAMs for a given ICAO location (required query param: icao).
 *
 * Query params:
 *   icao    - 4-letter ICAO location indicator (required)
 *   page    - page number (default: 1)
 *   limit   - results per page (default: 20, max: 100)
 */
router.get(
  '/',
  validate(notamQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await notamService.listNotams(req.query);
      res.json(
        successResponse(result.notams, `NOTAMs for ${req.query.icao?.toUpperCase()}.`, {
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit),
          },
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/notams/:id
 * Retrieve a single NOTAM by its FAA NOTAM ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const notam = await notamService.getNotamById(req.params.id);
    if (!notam) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(`NOTAM with id ${req.params.id} not found.`));
    }
    res.json(successResponse(notam));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
