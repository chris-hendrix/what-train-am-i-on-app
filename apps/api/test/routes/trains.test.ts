import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { GTFSService } from '../../src/services/gtfs-service/index.js';

describe('Trains API', () => {
  beforeAll(async () => {
    const gtfsService = GTFSService.getInstance();
    await gtfsService.loadData();
    
    // Mock GTFS-RT service since we don't want to make real API calls in tests
    vi.doMock('../../src/services/gtfs-rt-service/index.js', () => ({
      GTFSRTService: {
        getInstance: () => ({
          getVehiclePositions: vi.fn().mockResolvedValue([])
        })
      }
    }));
  });
  describe('POST /trains/nearest', () => {
    it('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/trains/nearest')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/trains/nearest')
        .send({
          latitude: 40.7589,
          longitude: -73.9851
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid data types', async () => {
      const response = await request(app)
        .post('/trains/nearest')
        .send({
          latitude: 'invalid',
          longitude: 'invalid',
          lineCode: '6',
          direction: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should accept valid request with all required fields', async () => {
      const response = await request(app)
        .post('/trains/nearest')
        .send({
          latitude: 40.7589,
          longitude: -73.9851,
          lineCode: '6',
          direction: 0,
          radiusMeters: 500
        });

      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      
      if (response.body.success) {
        expect(response.body.data).toHaveProperty('trains');
        expect(response.body.data).toHaveProperty('totalFound');
      }
    });

    it('should return valid JSON with correct headers', async () => {
      await request(app)
        .post('/trains/nearest')
        .send({
          latitude: 40.7589,
          longitude: -73.9851,
          lineCode: '6',
          direction: 0
        })
        .expect('Content-Type', /json/);
    });
  });
});