import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Health Endpoint', () => {
  it('should return status ok', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('should return valid JSON', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toBeDefined();
  });
});