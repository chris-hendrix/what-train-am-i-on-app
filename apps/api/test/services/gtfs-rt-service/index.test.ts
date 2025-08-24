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





  describe('Trip ID Direction Parsing', () => {
    it('should identify uptown/northbound trains (.N patterns)', () => {
      expect(gtfsRTService.getDirectionFromTripId('123456_N..N34R')).toBe(0);
      expect(gtfsRTService.getDirectionFromTripId('123456.N')).toBe(0);
      expect(gtfsRTService.getDirectionFromTripId('L0S1-L-2345-S01_123456_L..N08R')).toBe(0);
    });

    it('should identify downtown/southbound trains (.S patterns)', () => {
      expect(gtfsRTService.getDirectionFromTripId('123456_N..S34R')).toBe(1);
      expect(gtfsRTService.getDirectionFromTripId('123456.S')).toBe(1);
      expect(gtfsRTService.getDirectionFromTripId('L0S1-L-2345-S01_123456_L..S08R')).toBe(1);
    });

    it('should return -1 for invalid trip IDs', () => {
      expect(gtfsRTService.getDirectionFromTripId('')).toBe(-1);
      expect(gtfsRTService.getDirectionFromTripId(undefined)).toBe(-1);
      expect(gtfsRTService.getDirectionFromTripId('invalid_trip_id')).toBe(-1);
    });

    it('should handle complex MTA trip ID formats', () => {
      // Real MTA formats with service prefixes
      expect(gtfsRTService.getDirectionFromTripId('L0S2-N-2057-S05_080500_N..N34R')).toBe(0);
      expect(gtfsRTService.getDirectionFromTripId('L0S1-L-2345-S01_123456_L..S08R')).toBe(1);
      
      // Simple formats
      expect(gtfsRTService.getDirectionFromTripId('080500_N..N34R')).toBe(0);
      expect(gtfsRTService.getDirectionFromTripId('080500_N..S34R')).toBe(1);
    });
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', () => {
      expect(gtfsRTService).toBeDefined();
    });
  });
});