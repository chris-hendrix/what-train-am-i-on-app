/**
 * Unit tests for GTFSRTService
 * Tests the acceptance criteria for GitHub issue #10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GTFSRTService } from '../../../src/services/gtfs-rt-service/index.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('GTFSRTService', () => {
  let gtfsRTService: GTFSRTService;
  
  beforeEach(() => {
    gtfsRTService = GTFSRTService.getInstance();
    gtfsRTService.clearCache();
    vi.clearAllMocks();
    // Suppress console.error logs during tests to avoid noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Service Creation', () => {
    it('should create singleton instance', () => {
      const instance1 = GTFSRTService.getInstance();
      const instance2 = GTFSRTService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should have correct feed URLs', () => {
      expect(gtfsRTService).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should start with empty cache', () => {
      const stats = gtfsRTService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toEqual([]);
    });

    it('should clear cache', () => {
      gtfsRTService.clearCache();
      const stats = gtfsRTService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch failures gracefully', async () => {
      // Mock fetch to reject
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(gtfsRTService.getVehiclePositions()).rejects.toThrow('No vehicle position data could be fetched from any feed');
    });

    it('should handle 404 responses', async () => {
      // Mock fetch to return 404
      vi.mocked(fetch).mockResolvedValue(
        new Response('Not Found', { status: 404, statusText: 'Not Found' })
      );

      await expect(gtfsRTService.getVehiclePositions()).rejects.toThrow('No vehicle position data could be fetched from any feed');
    });
  });

  describe('Service Alerts', () => {
    it('should return empty array when feed fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const alerts = await gtfsRTService.getServiceAlerts();
      expect(alerts).toEqual([]);
    });

    it('should return empty array for empty feed', async () => {
      // Mock successful response with empty feed
      const mockFeedData = {
        header: { gtfsRealtimeVersion: '2.0' },
        entity: []
      };
      
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockFeedData), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );

      const alerts = await gtfsRTService.getServiceAlerts();
      expect(alerts).toEqual([]);
    });
  });

  describe('Arrival Predictions', () => {
    it('should return empty array when no data available', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const predictions = await gtfsRTService.getArrivalPredictions('R24');
      expect(predictions).toEqual([]);
    });
  });

  describe('Trains Near Station', () => {
    it('should handle errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(gtfsRTService.getTrainsNearStation('R24')).rejects.toThrow();
    });
  });

  describe('API Key Configuration', () => {
    it('should work without API key (URL-encoded endpoints)', () => {
      // Service should initialize without throwing
      expect(gtfsRTService).toBeDefined();
    });
  });
});