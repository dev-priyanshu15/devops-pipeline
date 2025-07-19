const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Use /tmp for logs in container (writable by all users)
const logsDir = process.env.NODE_ENV === 'production' ? '/tmp/logs' : path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create logs directory, using console only:', error.message);
  }
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      service: 'devops-pipeline',
      environment: process.env.NODE_ENV || 'development'
    });
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Only add file transports if logs directory is writable
try {
  if (fs.existsSync(logsDir)) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5
      })
    );
  }
} catch (error) {
  console.warn('File logging disabled:', error.message);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports
});

module.exports = logger;
