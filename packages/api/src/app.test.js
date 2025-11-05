import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from './app.js';

describe('Health Check', () => {
  it('should return 200 OK for /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: 'OK', db: 'OK', redis: 'OK' });
  });
});

describe('Not Found Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Not Found');
  });
});

describe('Swagger UI', () => {
  it('should return 200 OK for /api-docs', async () => {
    const res = await request(app).get('/api-docs');
    expect(res.statusCode).toEqual(200);
  });
});