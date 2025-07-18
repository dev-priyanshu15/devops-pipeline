const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Application metrics
let metrics = {
  requests: 0,
  errors: 0,
  startTime: Date.now()
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Request counter middleware
app.use((req, res, next) => {
  metrics.requests++;
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'íº€ DevOps Pipeline App Running!',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hostname: require('os').hostname(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  };
  
  res.status(200).json(healthStatus);
});

// Metrics endpoint for Prometheus
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

# HELP nodejs_version Node.js version info
# TYPE nodejs_version gauge
nodejs_version{version="${process.version}"} 1
`;
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics.trim());
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
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

const server = app.listen(PORT, () => {
  console.log(`íº€ Server running on port ${PORT}`);
  console.log(`í³Š Health check: http://localhost:${PORT}/health`);
  console.log(`í³ˆ Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
