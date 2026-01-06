const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { env } = require('../config');
const { successResponse, errorResponse } = require('../utils/response');
const { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } = require('../utils/errors');

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

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, supervisorId } = req.body;

    if (!name || !email || !password || !role) {
      throw new BadRequestError('Name, email, password, and role are required');
    }

    const validRoles = ['admin', 'supervisor', 'agent', 'candidate'];
    if (!validRoles.includes(role)) {
      throw new BadRequestError('Invalid role');
    }

    if (role === 'agent') {
      if (!supervisorId) {
        throw new BadRequestError('supervisorId is required for agents');
      }

      const supervisor = await User.findById(supervisorId);
      if (!supervisor) {
        throw new BadRequestError('Invalid supervisor ID');
      }
      if (supervisor.role !== 'supervisor') {
        throw new BadRequestError('Invalid supervisor ID');
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

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

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user);

    return successResponse(res, { token });
  } catch (error) {
    next(error);
  }
};

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
