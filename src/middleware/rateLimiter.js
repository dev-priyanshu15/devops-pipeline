const { RateLimiterRedis } = require('rate-limiter-flexible');
const { redisClient } = require('../config/database');
const logger = require('../config/logger');

// General API rate limiter
const apiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'api',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Auth endpoints rate limiter (stricter)
const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'auth',
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 300, // Block for 5 minutes
});

const createRateLimitMiddleware = (limiter, type = 'api') => {
  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch (rejRes) {
      const remainingPoints = rejRes.remainingPoints || 0;
      const msBeforeNext = rejRes.msBeforeNext || 1000;
      
      logger.warn(`Rate limit exceeded for ${type}`, {
        ip: req.ip,
        endpoint: req.path,
        remainingPoints,
        msBeforeNext
      });
      
      res.status(429).json({
        status: 'error',
        message: 'Too many requests',
        retryAfter: Math.round(msBeforeNext / 1000)
      });
    }
  };
};

module.exports = {
  apiRateLimit: createRateLimitMiddleware(apiLimiter, 'api'),
  authRateLimit: createRateLimitMiddleware(authLimiter, 'auth')
};
