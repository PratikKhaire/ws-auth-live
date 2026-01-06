const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { env } = require('../config');
const { successResponse, errorResponse } = require('../utils/response');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errors');

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

/**
 * POST /auth/signup
 * Register a new user
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, supervisorId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      throw new BadRequestError('Name, email, password, and role are required');
    }

    // Validate role
    const validRoles = ['admin', 'supervisor', 'agent', 'candidate'];
    if (!validRoles.includes(role)) {
      throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Validate supervisorId for agents
    if (role === 'agent') {
      if (!supervisorId) {
        throw new BadRequestError('supervisorId is required for agents');
      }

      // Verify supervisor exists and is a supervisor
      const supervisor = await User.findById(supervisorId);
      if (!supervisor) {
        throw new NotFoundError('Supervisor not found');
      }
      if (supervisor.role !== 'supervisor') {
        throw new BadRequestError('supervisorId must reference a user with supervisor role');
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Create user
    const userData = { name, email, password, role };
    if (role === 'agent') {
      userData.supervisorId = supervisorId;
    }

    const user = await User.create(userData);

    return successResponse(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * User login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user);

    return successResponse(res, { token });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 * Get current authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return successResponse(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe
};
