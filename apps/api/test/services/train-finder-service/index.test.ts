/**
 * Unit tests for TrainFinderService
 * Tests the core train identification algorithm
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainFinderService } from '../../../src/services/train-finder-service/index.js';
import { VehiclePositionWithFeed } from '../../../src/services/gtfs-rt-service/types/index.js';
import { TrainFinderRequest } from '../../../src/services/train-finder-service/types/index.js';

// Mock the GTFS-RT service
const mockGetVehiclePositions = vi.fn();

vi.mock('../../../src/services/gtfs-rt-service/index.js', () => ({
  GTFSRTService: {
    getInstance: vi.fn(() => ({
      getVehiclePositions: mockGetVehiclePositions
    }))
  }
}));

describe('TrainFinderService', () => {
  let trainFinderService: TrainFinderService;

  const validRequest: TrainFinderRequest = {
    userLatitude: 40.7589, // Times Square area
    userLongitude: -73.9851,
    lineCode: '6',
    direction: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVehiclePositions.mockResolvedValue([]);
    trainFinderService = TrainFinderService.getInstance();
  });

  describe('Input Validation', () => {
    it('should throw error for missing userLatitude', async () => {
      const invalidRequest = { ...validRequest, userLatitude: undefined } as unknown as TrainFinderRequest;
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, lineCode, and direction are required');
    });

    it('should throw error for missing userLongitude', async () => {
      const invalidRequest = { ...validRequest, userLongitude: undefined } as unknown as TrainFinderRequest;
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, lineCode, and direction are required');
    });

    it('should throw error for missing lineCode', async () => {
      const invalidRequest = { ...validRequest, lineCode: undefined } as unknown as TrainFinderRequest;
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, lineCode, and direction are required');
    });

    it('should throw error for missing direction', async () => {
      const invalidRequest = { ...validRequest, direction: undefined } as unknown as TrainFinderRequest;
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, lineCode, and direction are required');
    });

    it('should throw error for invalid direction value', async () => {
      const invalidRequest = { ...validRequest, direction: 2 };
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('direction must be 0 or 1');
    });

    it('should throw error for non-numeric coordinates', async () => {
      const invalidRequest = { ...validRequest, userLatitude: 'invalid' as unknown as number };
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude and userLongitude must be numbers');
    });

    it('should throw error for coordinates outside NYC area', async () => {
      const invalidRequest = { ...validRequest, userLatitude: 35.0, userLongitude: -120.0 };
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('Location appears to be outside NYC area');
    });

    it('should throw error for empty lineCode', async () => {
      const invalidRequest = { ...validRequest, lineCode: '' };
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, lineCode, and direction are required');
    });
  });

  describe('Train Finding Logic', () => {
    it('should return empty array when no vehicles are found', async () => {
      // Mock is already set to return [] by default in beforeEach
      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toEqual([]);
      expect(mockGetVehiclePositions).toHaveBeenCalledWith('6');
    });

    it('should return empty array when no vehicles match direction', async () => {
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'train1',
          vehicle: {
            trip: { tripId: 'trip1', routeId: '6', directionId: 1 }, // Wrong direction
            position: { latitude: 40.7589, longitude: -73.9851 }
          },
          feedLines: '6',
          timestamp: Date.now()
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toEqual([]);
    });

    it('should return empty array when vehicles are too far away', async () => {
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'train1',
          vehicle: {
            trip: { tripId: 'trip1', routeId: '6', directionId: 0 },
            position: { latitude: 41.0, longitude: -74.0 } // Very far away
          },
          feedLines: '6',
          timestamp: Date.now()
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toEqual([]);
    });

    it('should return nearby trains sorted by distance', async () => {
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'train1',
          vehicle: {
            trip: { tripId: 'trip1', routeId: '6', directionId: 0 },
            position: { latitude: 40.7600, longitude: -73.9851 }, // ~120m away
            label: 'Train 1'
          },
          feedLines: '6',
          timestamp: Date.now()
        },
        {
          id: 'train2', 
          vehicle: {
            trip: { tripId: 'trip2', routeId: '6', directionId: 0 },
            position: { latitude: 40.7589, longitude: -73.9861 }, // ~80m away
            label: 'Train 2'
          },
          feedLines: '6',
          timestamp: Date.now()
        },
        {
          id: 'train3',
          vehicle: {
            trip: { tripId: 'trip3', routeId: '6', directionId: 0 },
            position: { latitude: 40.7595, longitude: -73.9856 }, // ~60m away
            label: 'Train 3'
          },
          feedLines: '6',
          timestamp: Date.now()
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toHaveLength(3);
      // Should be sorted by distance (nearest first)
      expect(result[0].label).toBe('Train 3'); // Closest
      expect(result[1].label).toBe('Train 2'); // Middle
      expect(result[2].label).toBe('Train 1'); // Farthest
      
      // Verify distances are calculated and sorted
      expect(result[0].distanceToUser).toBeLessThan(result[1].distanceToUser);
      expect(result[1].distanceToUser).toBeLessThan(result[2].distanceToUser);
    });

    it('should handle vehicles without position data', async () => {
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'train1',
          vehicle: {
            trip: { tripId: 'trip1', routeId: '6', directionId: 0 }
            // No position data
          },
          feedLines: '6',
          timestamp: Date.now()
        },
        {
          id: 'train2',
          vehicle: {
            trip: { tripId: 'trip2', routeId: '6', directionId: 0 },
            position: { latitude: 40.7595, longitude: -73.9856 },
            label: 'Train 2'
          },
          feedLines: '6',
          timestamp: Date.now()
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Train 2');
    });

    it('should populate train candidate fields correctly', async () => {
      const mockTimestamp = Date.now();
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'vehicle123',
          vehicle: {
            trip: { 
              tripId: 'trip456', 
              routeId: '6', 
              directionId: 0 
            },
            position: { 
              latitude: 40.7595, 
              longitude: -73.9856,
              bearing: 45,
              speed: 25.5
            },
            label: 'Train A',
            stopId: 'stop789',
            currentStopSequence: 10,
            currentStatus: 1,
            timestamp: mockTimestamp
          },
          feedLines: '6',
          timestamp: mockTimestamp
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toHaveLength(1);
      const train = result[0];
      
      expect(train.vehicleId).toBe('vehicle123');
      expect(train.tripId).toBe('trip456');
      expect(train.routeId).toBe('6');
      expect(train.label).toBe('Train A');
      expect(train.position.latitude).toBe(40.7595);
      expect(train.position.longitude).toBe(-73.9856);
      expect(train.position.bearing).toBe(45);
      expect(train.position.speed).toBe(25.5);
      expect(train.currentStopId).toBe('stop789');
      expect(train.currentStopSequence).toBe(10);
      expect(train.currentStatus).toBe(1);
      expect(train.direction).toBe(0);
      expect(train.distanceToUser).toBeGreaterThan(0);
      expect(train.timestamp).toBe(mockTimestamp);
    });

    it('should handle missing optional fields gracefully', async () => {
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'vehicle123',
          vehicle: {
            position: { latitude: 40.7595, longitude: -73.9856 }
            // Missing trip, label, stopId, etc.
          },
          feedLines: '6',
          timestamp: Date.now()
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);
      
      const requestWithDirection1 = { ...validRequest, direction: 1 };
      const result = await trainFinderService.findNearestTrains(requestWithDirection1);

      expect(result).toHaveLength(0); // Should be filtered out due to no direction info
    });
  });

  describe('Distance Calculations', () => {
    it('should filter out trains beyond maximum proximity distance', async () => {
      // Create a train close by (should be included)
      // and one far away (should be excluded)
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'nearTrain',
          vehicle: {
            trip: { tripId: 'trip1', routeId: '6', directionId: 0 },
            position: { latitude: 40.7600, longitude: -73.9851 }, // ~120m north
            label: 'Near Train'
          },
          feedLines: '6',
          timestamp: Date.now()
        },
        {
          id: 'farTrain',
          vehicle: {
            trip: { tripId: 'trip2', routeId: '6', directionId: 0 },
            position: { latitude: 40.7750, longitude: -73.9851 }, // ~1800m north - very far
            label: 'Far Train'
          },
          feedLines: '6',
          timestamp: Date.now()
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Near Train');
      expect(result[0].distanceToUser).toBeLessThanOrEqual(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle GTFS-RT service errors gracefully', async () => {
      mockGetVehiclePositions.mockRejectedValue(new Error('API Error'));

      await expect(trainFinderService.findNearestTrains(validRequest))
        .rejects.toThrow('API Error');
    });
  });
});