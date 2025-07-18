const request = require('supertest');
const app = require('./index');

describe('DevOps Pipeline App', () => {
  test('GET / should return app information', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('íº€ DevOps Pipeline App Running!');
    expect(response.body.version).toBe('1.0.0');
  });

  test('GET /health should return health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
