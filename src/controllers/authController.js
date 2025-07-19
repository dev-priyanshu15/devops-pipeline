const User = require('../models/User');
const { generateToken, blacklistToken } = require('../middleware/auth');
const { pgPool } = require('../config/database');
const logger = require('../config/logger');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
  name: Joi.string().min(2).max(50).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register new user
const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    const { email, password, name } = value;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists'
      });
    }
    
    // Create new user
    const user = new User({ email, password, name });
    await user.save();
    
    // Log to PostgreSQL for analytics
    try {
      await pgPool.query(
        'INSERT INTO user_analytics (user_id, action, timestamp, metadata) VALUES ($1, $2, $3, $4)',
        [user._id.toString(), 'register', new Date(), JSON.stringify({ ip: req.ip, userAgent: req.get('User-Agent') })]
      );
    } catch (pgError) {
      logger.warn('Failed to log user analytics:', pgError);
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    logger.info('User registered successfully', { userId: user._id, email });
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    const { email, password } = value;
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        status: 'error',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }
    
    // Reset login attempts and update last login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();
    
    // Log to PostgreSQL
    try {
      await pgPool.query(
        'INSERT INTO user_analytics (user_id, action, timestamp, metadata) VALUES ($1, $2, $3, $4)',
        [user._id.toString(), 'login', new Date(), JSON.stringify({ ip: req.ip, userAgent: req.get('User-Agent') })]
      );
    } catch (pgError) {
      logger.warn('Failed to log user analytics:', pgError);
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    logger.info('User logged in successfully', { userId: user._id, email });
    
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Blacklist the token
    await blacklistToken(req.token);
    
    logger.info('User logged out successfully', { userId: req.userId });
    
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile
};
