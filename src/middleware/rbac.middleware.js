const { ForbiddenError } = require('../utils/errors');

/**
 * Role-Based Access Control Middleware
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Forbidden for role: ${req.user.role}`));
    }

    next();
  };
};

module.exports = rbacMiddleware;
