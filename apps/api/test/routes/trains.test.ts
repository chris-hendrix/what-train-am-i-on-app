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
          // lineCode is missing
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

    it('should accept request without direction (searches all directions)', async () => {
      const response = await request(app)
        .post('/trains/nearest')
        .send({
          latitude: 40.7589,
          longitude: -73.9851,
          lineCode: '6'
        });

      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should accept request with headsign parameter', async () => {
      const response = await request(app)
        .post('/trains/nearest')
        .send({
          latitude: 40.7589,
          longitude: -73.9851,
          lineCode: '6',
          headsign: 'Brooklyn Bridge-City Hall'
        });

      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 400 for invalid headsign', async () => {
      const response = await request(app)
        .post('/trains/nearest')
        .send({
          latitude: 40.7589,
          longitude: -73.9851,
          lineCode: '6',
          headsign: 'Invalid Headsign'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/Invalid headsign/);
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

  describe('POST /trains/identify', () => {
    it('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing lineCode', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({
          direction: 0,
          stopId: '601N'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/lineCode is required/);
    });

    it('should return 400 for missing direction', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          stopId: '601N'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/direction must be 0 \(uptown\) or 1 \(downtown\)/);
    });

    it('should return 400 for invalid direction', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          direction: 2, // Invalid direction
          stopId: '601N'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/direction must be 0 \(uptown\) or 1 \(downtown\)/);
    });

    it('should return 400 for missing stopId', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          direction: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/stopId is required/);
    });

    it('should accept valid request with all required fields', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          direction: 0,
          stopId: '601N'
        });

      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      
      if (response.body.success) {
        expect(response.body.data).toHaveProperty('trains');
        expect(response.body.data).toHaveProperty('userStop');
        expect(response.body.data).toHaveProperty('request');
        expect(response.body.data).toHaveProperty('processedAt');
        expect(Array.isArray(response.body.data.trains)).toBe(true);
      }
    });

    it('should accept valid request with optional limit parameter', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          direction: 1,
          stopId: '601S',
          limit: 3
        });

      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      
      if (response.body.success) {
        expect(response.body.data).toHaveProperty('trains');
        expect(response.body.data).toHaveProperty('userStop');
        expect(response.body.data).toHaveProperty('request');
        expect(response.body.data.request.limit).toBe(3);
      }
    });

    it('should return valid JSON with correct headers', async () => {
      await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          direction: 0,
          stopId: '601N'
        })
        .expect('Content-Type', /json/);
    });

    it('should handle different line codes', async () => {
      const response = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: 'L',
          direction: 1,
          stopId: 'L01S'
        });

      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle both uptown (0) and downtown (1) directions', async () => {
      const uptownResponse = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          direction: 0,
          stopId: '601N'
        });

      const downtownResponse = await request(app)
        .post('/trains/identify')
        .send({
          lineCode: '6',
          direction: 1,
          stopId: '601S'
        });

      expect(uptownResponse.status).not.toBe(400);
      expect(downtownResponse.status).not.toBe(400);
      expect(uptownResponse.body).toHaveProperty('success');
      expect(downtownResponse.body).toHaveProperty('success');
    });
  });
});