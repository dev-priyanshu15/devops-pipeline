const request = require('supertest');

// Mock all external dependencies
jest.mock('./config/database', () => ({
  pgPool: {
    query: jest.fn().mockResolvedValue({ rows: [] })
  },
  mongoConnect: jest.fn().mockResolvedValue(),
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG')
  }
}));

jest.mock('./database/migrate', () => ({
  runMigrations: jest.fn().mockResolvedValue()
}));

jest.mock('./config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Set test environment
process.env.NODE_ENV = 'test';

const app = require('./index');

describe('DevOps Pipeline App - Database Edition', () => {
  describe('Basic Routes', () => {
    test('GET / should return enhanced app information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Database Edition');
      expect(response.body.version).toBe('2.1.0');
      expect(response.body.features).toBeInstanceOf(Array);
      expect(response.body.features).toContain('JWT Authentication');
    });

    test('GET /health should return enhanced health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.version).toBe('2.1.0');
      expect(response.body.databases).toBeDefined();
    });

    test('GET /metrics should return Prometheus metrics', async () => {
      const response = await request(app).get('/metrics');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('app_info');
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });
});
