const jwt = require('jsonwebtoken');
const { env } = require('../config');
const { User } = require('../models');
const { UnauthorizedError } = require('../utils/errors');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }
    next(error);
  }
};

module.exports = authMiddleware;
