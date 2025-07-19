const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { redisClient } = require('../config/database');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Verify JWT Token Middleware
const verifyToken = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }
    
    // Check if token is blacklisted (Redis)
    const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        status: 'error',
        message: 'Token has been invalidated'
      });
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.token = token;
    
    logger.info('Token verified successfully', { userId: decoded.userId });
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

// Blacklist token (for logout)
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.setEx(`blacklist_${token}`, expiresIn, 'true');
    logger.info('Token blacklisted successfully');
  } catch (error) {
    logger.error('Error blacklisting token:', error);
  }
};

module.exports = {
  generateToken,
  verifyToken,
  blacklistToken
};
