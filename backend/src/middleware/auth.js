const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HTTP_STATUS, USER_ROLES } = require('../utils/constants');
const { errorResponse } = require('../utils/helpers');

/**
 * Verify JWT and attach the authenticated user to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse('Authentication token is missing or malformed.'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data (checks isActive, password changes, etc.)
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user || !user.isActive) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse('User account not found or has been deactivated.'));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse('Password was recently changed. Please log in again.'));
    }

    req.user = user;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Authentication token has expired.'
        : 'Invalid authentication token.';
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse(message));
  }
}

/**
 * Factory: restrict access to one or more roles.
 * @param {...string} roles  USER_ROLES values
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse('Not authenticated.'));
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json(
          errorResponse(
            `Access denied. Required role(s): ${roles.join(', ')}.`
          )
        );
    }
    next();
  };
}

/** Shorthand authorizers */
const requireAdmin = authorize(USER_ROLES.ADMIN);
const requireDispatcher = authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER);
const requirePilotOrAbove = authorize(USER_ROLES.ADMIN, USER_ROLES.DISPATCHER, USER_ROLES.PILOT);

module.exports = { authenticate, authorize, requireAdmin, requireDispatcher, requirePilotOrAbove };
