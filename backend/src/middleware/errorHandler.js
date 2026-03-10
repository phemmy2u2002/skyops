const logger = require('./logger');
const { HTTP_STATUS } = require('../utils/constants');
const { errorResponse } = require('../utils/helpers');

/**
 * Global error handler — must be registered LAST with app.use().
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Default to 500
  let statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'An unexpected error occurred.';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    logger.warn('Mongoose validation error', { path: req.path, errors });
    return res.status(statusCode).json(errorResponse('Validation failed.', errors));
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists.`;
    logger.warn('Duplicate key error', { path: req.path, keyValue: err.keyValue });
    return res.status(statusCode).json(errorResponse(message));
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid ID format: ${err.value}`;
    return res.status(statusCode).json(errorResponse(message));
  }

  // JWT errors (should normally be caught in auth middleware, but just in case)
  if (err.name === 'JsonWebTokenError') {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse('Invalid token.'));
  }
  if (err.name === 'TokenExpiredError') {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse('Token has expired.'));
  }

  // Log unexpected server errors
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    // Don't leak internal details in production
    if (process.env.NODE_ENV === 'production') {
      message = 'An internal server error occurred.';
    }
  }

  return res.status(statusCode).json(errorResponse(message));
}

/**
 * 404 handler — register before errorHandler.
 */
function notFoundHandler(req, res) {
  res
    .status(HTTP_STATUS.NOT_FOUND)
    .json(errorResponse(`Route ${req.method} ${req.originalUrl} not found.`));
}

module.exports = { errorHandler, notFoundHandler };
