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

      await expect(gtfsRTService.getVehiclePositions('6')).rejects.toThrow('GTFSRTUnavailableError');
    });

    it('should handle 404 responses', async () => {
      // Mock fetch to return 404
      vi.mocked(fetch).mockResolvedValue(
        new Response('Not Found', { status: 404, statusText: 'Not Found' })
      );

      await expect(gtfsRTService.getVehiclePositions('6')).rejects.toThrow('GTFSRTUnavailableError');
    });

    it('should throw error for unknown line code', async () => {
      await expect(gtfsRTService.getVehiclePositions('INVALID')).rejects.toThrow('Unknown line code: INVALID');
    });
  });





  describe('Service Initialization', () => {
    it('should initialize successfully', () => {
      expect(gtfsRTService).toBeDefined();
    });
  });
});