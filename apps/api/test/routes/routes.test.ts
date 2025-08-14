import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { GTFSService } from '../../src/services/gtfs-service/index.js';

describe('Routes API', () => {
  beforeAll(async () => {
    const gtfsService = GTFSService.getInstance();
    await gtfsService.loadData();
  });
  describe('GET /routes', () => {
    it('should return 200 with success response', async () => {
      const response = await request(app)
        .get('/routes')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return routes array in correct format', async () => {
      const response = await request(app)
        .get('/routes')
        .expect(200);

      const { data } = response.body;
      expect(data).toHaveProperty('routes');
      expect(Array.isArray(data.routes)).toBe(true);

      if (data.routes.length > 0) {
        const route = data.routes[0];
        expect(route).toHaveProperty('id');
        expect(route).toHaveProperty('shortName');
        expect(route).toHaveProperty('longName');
        expect(route).toHaveProperty('color');
        expect(typeof route.id).toBe('string');
        expect(typeof route.shortName).toBe('string');
        expect(typeof route.longName).toBe('string');
      }
    });

    it('should return valid JSON with correct headers', async () => {
      await request(app)
        .get('/routes')
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });
});