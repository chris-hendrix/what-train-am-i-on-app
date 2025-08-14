import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Health Endpoint', () => {
  it('should return success response with health data', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    // Check SuccessResponse structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('string');

    // Check health data structure
    const healthData = response.body.data;
    expect(healthData).toHaveProperty('status', 'ok');
    expect(healthData).toHaveProperty('version', '1.0.0');
    expect(healthData).toHaveProperty('services');
    expect(healthData.services).toHaveProperty('database', 'ok');
    expect(healthData.services).toHaveProperty('mta', 'ok');
  });

  it('should return valid JSON with correct content type', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
  });
});