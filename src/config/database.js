const { Pool } = require('pg');
const mongoose = require('mongoose');
const redis = require('redis');

// Simple logger fallback
const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', message: msg, ...meta })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', message: msg, ...meta })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', message: msg, ...meta }))
};

// Parse Kubernetes service environment variables
const parseKubernetesEnv = () => {
  // PostgreSQL - use service host/port from Kubernetes
  const pgHost = process.env.POSTGRES_SERVICE_HOST || process.env.POSTGRES_HOST || 'postgres';
  const pgPort = process.env.POSTGRES_SERVICE_PORT || process.env.POSTGRES_PORT || 5432;
  
  // Redis - use service host/port from Kubernetes  
  const redisHost = process.env.REDIS_SERVICE_HOST || process.env.REDIS_HOST || 'redis';
  const redisPort = process.env.REDIS_SERVICE_PORT || process.env.REDIS_PORT || 6379;
  
  // MongoDB - use service host/port from Kubernetes
  const mongoHost = process.env.MONGODB_SERVICE_HOST || 'mongodb';
  const mongoPort = process.env.MONGODB_SERVICE_PORT || 27017;
  
  return {
    postgres: {
      host: pgHost,
      port: parseInt(pgPort),
      database: process.env.POSTGRES_DB || 'devopsdb',
      user: process.env.POSTGRES_USER || 'devops',
      password: process.env.POSTGRES_PASSWORD || 'password'
    },
    redis: {
      host: redisHost,
      port: parseInt(redisPort)
    },
    mongodb: {
      host: mongoHost,
      port: parseInt(mongoPort)
    }
  };
};

const config = parseKubernetesEnv();

logger.info('Database configuration:', {
  postgres: `${config.postgres.host}:${config.postgres.port}/${config.postgres.database}`,
  redis: `${config.redis.host}:${config.redis.port}`,
  mongodb: `${config.mongodb.host}:${config.mongodb.port}`
});

// PostgreSQL Configuration
const pgPool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on('connect', () => {
  logger.info('Ì∞ò PostgreSQL connected successfully');
});

pgPool.on('error', (err) => {
  logger.error('‚ùå PostgreSQL error:', err.message);
});

// MongoDB Configuration
const mongoConnect = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 
      `mongodb://devops:password@${config.mongodb.host}:${config.mongodb.port}/devopsdb`;
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('ÌΩÉ MongoDB connected successfully');
  } catch (error) {
    logger.error('‚ùå MongoDB connection failed:', error.message);
    throw error;
  }
};

// Redis Configuration
const redisClient = redis.createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  logger.error('‚ùå Redis error:', err.message);
});

redisClient.on('connect', () => {
  logger.info('Ì¥¥ Redis connected successfully');
});

redisClient.on('ready', () => {
  logger.info('Ì¥¥ Redis is ready');
});

// Connect to Redis with error handling
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('‚ùå Redis connection failed:', error.message);
  }
};

module.exports = {
  pgPool,
  mongoConnect,
  redisClient,
  connectRedis
};
