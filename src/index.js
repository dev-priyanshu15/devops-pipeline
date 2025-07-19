require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple logger
const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', message: msg, ...meta })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', message: msg, ...meta })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', message: msg, ...meta }))
};

// Application metrics
let metrics = {
  requests: 0,
  errors: 0,
  startTime: Date.now()
};

// Database status
let dbStatus = {
  postgres: false,
  mongodb: false,
  redis: false
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging and metrics
app.use((req, res, next) => {
  const start = Date.now();
  metrics.requests++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'íº€ DevOps Pipeline App - Database Edition!',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hostname: require('os').hostname(),
    uptime: process.uptime(),
    features: [
      'JWT Authentication (Ready)',
      'Database Integration (Connecting...)',
      'Security Scanning',
      'Performance Monitoring',
      'Container Orchestration'
    ],
    databases: dbStatus
  });
});

app.get('/health', (req, res) => {
  const allDbHealthy = Object.values(dbStatus).every(status => status === true);
  
  const healthStatus = {
    status: allDbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.1.0',
    databases: dbStatus
  };
  
  res.status(200).json(healthStatus);
});

// Enhanced metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
  const memory = process.memoryUsage();
  
  const prometheusMetrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.requests}

# HELP http_errors_total Total number of HTTP errors
# TYPE http_errors_total counter
http_errors_total ${metrics.errors}

# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds ${uptime}

# HELP memory_usage_bytes Memory usage in bytes
# TYPE memory_usage_bytes gauge
memory_usage_bytes{type="rss"} ${memory.rss}
memory_usage_bytes{type="heapTotal"} ${memory.heapTotal}
memory_usage_bytes{type="heapUsed"} ${memory.heapUsed}

# HELP app_info Application information
# TYPE app_info gauge
app_info{version="2.1.0",environment="${process.env.NODE_ENV || 'development'}"} 1
`;
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics.trim());
});

// Database health endpoint
app.get('/api/health/databases', (req, res) => {
  res.json({
    status: Object.values(dbStatus).every(s => s) ? 'healthy' : 'degraded',
    databases: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res) => {
  logger.error('Unhandled error:', err);
  metrics.errors++;
  res.status(500).json({ 
    error: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Initialize databases in background
const initializeDatabases = async () => {
  // Try MongoDB
  try {
    const { mongoConnect } = require('./config/database');
    await mongoConnect();
    dbStatus.mongodb = true;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
  }

  // Try Redis
  try {
    const { connectRedis } = require('./config/database');
    await connectRedis();
    dbStatus.redis = true;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
  }

  // Try PostgreSQL
  try {
    const { pgPool } = require('./config/database');
    await pgPool.query('SELECT 1');
    dbStatus.postgres = true;
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error.message);
  }
};

// Start server
const server = app.listen(PORT, () => {
  logger.info(`íº€ Server running on port ${PORT}`);
  logger.info(`í³Š Health check: http://localhost:${PORT}/health`);
  logger.info(`í³ˆ Metrics: http://localhost:${PORT}/metrics`);
  logger.info(`í¼ Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize databases after server starts
  initializeDatabases();
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
