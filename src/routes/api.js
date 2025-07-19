const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const { pgPool } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Get user analytics (admin only)
router.get('/analytics', apiRateLimit, verifyToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        action,
        COUNT(*) as count,
        DATE_TRUNC('day', timestamp) as date
      FROM user_analytics 
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY action, date
      ORDER BY date DESC
    `);
    
    res.json({
      status: 'success',
      data: {
        analytics: result.rows
      }
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Health check for databases
router.get('/health/databases', async (req, res) => {
  const health = {
    postgres: false,
    mongodb: false,
    redis: false
  };
  
  try {
    // Check PostgreSQL
    await pgPool.query('SELECT 1');
    health.postgres = true;
  } catch (error) {
    logger.error('PostgreSQL health check failed:', error);
  }
  
  try {
    // Check MongoDB
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      health.mongodb = true;
    }
  } catch (error) {
    logger.error('MongoDB health check failed:', error);
  }
  
  try {
    // Check Redis
    const { redisClient } = require('../config/database');
    await redisClient.ping();
    health.redis = true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }
  
  const allHealthy = Object.values(health).every(status => status === true);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    databases: health,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
