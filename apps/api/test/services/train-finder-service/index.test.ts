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
const mockGetTripUpdates = vi.fn();

vi.mock('../../../src/services/gtfs-rt-service/index.js', () => ({
  GTFSRTService: {
    getInstance: vi.fn(() => ({
      getVehiclePositions: mockGetVehiclePositions,
      getTripUpdates: mockGetTripUpdates
    }))
  }
}));

// Mock the GTFS service
const mockGetStop = vi.fn();

vi.mock('../../../src/services/gtfs-service/index.js', () => ({
  GTFSService: {
    getInstance: vi.fn(() => ({
      getStop: mockGetStop
    }))
  }
}));

// Mock the TrainBuilder service
const mockBuildTrainFromVehicleId = vi.fn();

vi.mock('../../../src/services/train-builder-service/index.js', () => ({
  TrainBuilderService: {
    getInstance: vi.fn(() => ({
      buildTrainFromVehicleId: mockBuildTrainFromVehicleId
    }))
  }
}));

describe('TrainFinderService', () => {
  let trainFinderService: TrainFinderService;

  const validRequest: TrainFinderRequest = {
    userLatitude: 40.7589, // Times Square area
    userLongitude: -73.9851,
    lineCode: '6',
    direction: 0 as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVehiclePositions.mockResolvedValue([]);
    mockGetTripUpdates.mockResolvedValue([]);
    mockGetStop.mockReturnValue(null);
    mockBuildTrainFromVehicleId.mockResolvedValue(null);
    trainFinderService = TrainFinderService.getInstance();
  });

  describe('Input Validation', () => {
    it('should throw error for missing userLatitude', async () => {
      const invalidRequest = { ...validRequest, userLatitude: undefined } as unknown as TrainFinderRequest;
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, and lineCode are required');
    });

    it('should throw error for missing userLongitude', async () => {
      const invalidRequest = { ...validRequest, userLongitude: undefined } as unknown as TrainFinderRequest;
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, and lineCode are required');
    });

    it('should throw error for missing lineCode', async () => {
      const invalidRequest = { ...validRequest, lineCode: undefined } as unknown as TrainFinderRequest;
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('userLatitude, userLongitude, and lineCode are required');
    });

    it('should accept request without direction (optional)', async () => {
      const requestWithoutDirection = { ...validRequest, direction: undefined } as TrainFinderRequest;
      
      // Should not throw error since direction is now optional
      const result = await trainFinderService.findNearestTrains(requestWithoutDirection);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error for invalid direction value', async () => {
      const invalidRequest = { ...validRequest, direction: 2 as any };
      
      await expect(trainFinderService.findNearestTrains(invalidRequest))
        .rejects.toThrow('direction must be 0 or 1 if provided');
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
        .rejects.toThrow('userLatitude, userLongitude, and lineCode are required');
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
            trip: { tripId: '6..S01R', routeId: '6', directionId: 1 }, // Southbound trip ID, but request wants northbound (0)
            position: { latitude: 40.7589, longitude: -73.9851 }
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
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
          timestamp: { low: Date.now(), high: 0, unsigned: false }
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
            trip: { tripId: '6..N01R', routeId: '6', directionId: 0 }, // Northbound trip ID
            position: { latitude: 40.7600, longitude: -73.9851 }, // ~120m away
            label: 'Train 1'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        },
        {
          id: 'train2', 
          vehicle: {
            trip: { tripId: '6..N02R', routeId: '6', directionId: 0 }, // Northbound trip ID
            position: { latitude: 40.7589, longitude: -73.9861 }, // ~80m away
            label: 'Train 2'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        },
        {
          id: 'train3',
          vehicle: {
            trip: { tripId: '6..N03R', routeId: '6', directionId: 0 }, // Northbound trip ID
            position: { latitude: 40.7595, longitude: -73.9856 }, // ~60m away
            label: 'Train 3'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        }
      ];

      // Mock TrainBuilderService to return TrainInfo objects
      mockBuildTrainFromVehicleId.mockImplementation((vehicleId: string) => {
        const vehicle = mockVehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;
        
        return Promise.resolve({
          tripId: vehicle.vehicle.trip?.tripId || '',
          routeId: vehicle.vehicle.trip?.routeId || '',
          directionId: vehicle.vehicle.trip?.directionId || 0,
          arrivalTime: new Date().toISOString(),
          vehicleId: vehicle.id,
          currentStop: {
            stopId: 'test-stop',
            stopName: 'Test Stop',
            stopSequence: 1,
            status: 1,
            statusName: 'stopped'
          },
          stops: []
        });
      });

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
            trip: { tripId: '6..N01R', routeId: '6', directionId: 0 } // Northbound trip ID
            // No position data
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        },
        {
          id: 'train2',
          vehicle: {
            trip: { tripId: '6..N02R', routeId: '6', directionId: 0 }, // Northbound trip ID
            position: { latitude: 40.7595, longitude: -73.9856 },
            label: 'Train 2'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        }
      ];

      // Mock TrainBuilderService to return TrainInfo only for train2
      mockBuildTrainFromVehicleId.mockImplementation((vehicleId: string) => {
        if (vehicleId === 'train2') {
          return Promise.resolve({
            tripId: '6..N02R',
            routeId: '6',
            directionId: 0,
            arrivalTime: new Date().toISOString(),
            vehicleId: 'train2',
            currentStop: {
              stopId: 'test-stop',
              stopName: 'Test Stop',
              stopSequence: 1,
              status: 1,
              statusName: 'stopped'
            },
            stops: []
          });
        }
        return Promise.resolve(null);
      });

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Train 2');
    });

    it('should populate train candidate fields correctly', async () => {
      const mockTimestamp = { low: Date.now(), high: 0, unsigned: false };
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'vehicle123',
          vehicle: {
            trip: { 
              tripId: '6..N01R', 
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
            currentStatus: '1',
            timestamp: mockTimestamp
          },
          feedLines: '6',
          timestamp: mockTimestamp
        }
      ];

      // Mock TrainBuilderService to return a complete TrainInfo object
      mockBuildTrainFromVehicleId.mockResolvedValue({
        tripId: '6..N01R',
        routeId: '6',
        directionId: 0,
        arrivalTime: new Date().toISOString(),
        vehicleId: 'vehicle123',
        currentStop: {
          stopId: 'stop789',
          stopName: 'Test Stop',
          stopSequence: 10,
          status: 1,
          statusName: 'stopped'
        },
        stops: []
      });

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toHaveLength(1);
      const train = result[0];
      
      // Check TrainInfo fields (inherited)
      expect(train.vehicleId).toBe('vehicle123');
      expect(train.tripId).toBe('6..N01R');
      expect(train.routeId).toBe('6');
      expect(train.directionId).toBe(0);
      expect(train.currentStop?.stopId).toBe('stop789');
      expect(train.currentStop?.stopSequence).toBe(10);
      expect(train.currentStop?.status).toBe(1);
      
      // Check TrainCandidate-specific fields
      expect(train.label).toBe('Train A');
      expect(train.position.latitude).toBe(40.7595);
      expect(train.position.longitude).toBe(-73.9856);
      expect(train.position.bearing).toBe(45);
      expect(train.position.speed).toBe(25.5);
      expect(train.distanceToUser).toBeGreaterThan(0);
      expect(train.timestamp).toBeDefined();
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
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        }
      ];

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);
      
      const requestWithDirection1 = { ...validRequest, direction: 1 as const };
      const result = await trainFinderService.findNearestTrains(requestWithDirection1);

      expect(result).toHaveLength(0); // Should be filtered out due to no direction info
    });

    it('should filter by trip ID pattern for direction', async () => {
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'northbound1',
          vehicle: {
            trip: { tripId: '6..N01R', routeId: '6' }, // Northbound pattern
            position: { latitude: 40.7595, longitude: -73.9856 },
            label: 'Northbound Train'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        },
        {
          id: 'southbound1',
          vehicle: {
            trip: { tripId: '6..S01R', routeId: '6' }, // Southbound pattern
            position: { latitude: 40.7595, longitude: -73.9856 },
            label: 'Southbound Train'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        },
        {
          id: 'shuttle1',
          vehicle: {
            trip: { tripId: 'GS.N01R', routeId: 'GS' }, // Shuttle northbound pattern
            position: { latitude: 40.7595, longitude: -73.9856 },
            label: 'Shuttle Train'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        }
      ];

      // Mock TrainBuilderService for all vehicles
      mockBuildTrainFromVehicleId.mockImplementation((vehicleId: string) => {
        const vehicle = mockVehicles.find(v => v.id === vehicleId);
        if (!vehicle) return Promise.resolve(null);
        
        return Promise.resolve({
          tripId: vehicle.vehicle.trip?.tripId || '',
          routeId: vehicle.vehicle.trip?.routeId || '',
          directionId: 0,
          arrivalTime: new Date().toISOString(),
          vehicleId: vehicle.id,
          currentStop: {
            stopId: 'test-stop',
            stopName: 'Test Stop',
            stopSequence: 1,
            status: 1,
            statusName: 'stopped'
          },
          stops: []
        });
      });

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      // Request northbound trains (direction 0)
      const northboundResult = await trainFinderService.findNearestTrains(validRequest);
      expect(northboundResult).toHaveLength(2);
      expect(northboundResult.some(t => t.label === 'Northbound Train')).toBe(true);
      expect(northboundResult.some(t => t.label === 'Shuttle Train')).toBe(true);

      // Request southbound trains (direction 1)
      const southboundRequest = { ...validRequest, direction: 1 as const };
      const southboundResult = await trainFinderService.findNearestTrains(southboundRequest);
      expect(southboundResult).toHaveLength(1);
      expect(southboundResult[0].label).toBe('Southbound Train');
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
            trip: { tripId: '6..N01R', routeId: '6', directionId: 0 }, // Northbound trip ID
            position: { latitude: 40.7600, longitude: -73.9851 }, // ~120m north
            label: 'Near Train'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        },
        {
          id: 'farTrain',
          vehicle: {
            trip: { tripId: '6..N02R', routeId: '6', directionId: 0 }, // Northbound trip ID
            position: { latitude: 40.7650, longitude: -73.9851 }, // ~700m north - beyond 500m limit
            label: 'Far Train'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        }
      ];

      // Mock TrainBuilderService for nearTrain only (farTrain filtered out before building)
      mockBuildTrainFromVehicleId.mockImplementation((vehicleId: string) => {
        if (vehicleId === 'nearTrain') {
          return Promise.resolve({
            tripId: '6..N01R',
            routeId: '6',
            directionId: 0,
            arrivalTime: new Date().toISOString(),
            vehicleId: 'nearTrain',
            currentStop: {
              stopId: 'test-stop',
              stopName: 'Test Stop',
              stopSequence: 1,
              status: 1,
              statusName: 'stopped'
            },
            stops: []
          });
        }
        return Promise.resolve(null);
      });

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      const result = await trainFinderService.findNearestTrains(validRequest);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Near Train');
      expect(result[0].distanceToUser).toBeLessThanOrEqual(500);
    });

    it('should respect custom radius parameter', async () => {
      const mockVehicles: VehiclePositionWithFeed[] = [
        {
          id: 'nearTrain',
          vehicle: {
            trip: { tripId: '6..N01R', routeId: '6', directionId: 0 },
            position: { latitude: 40.7600, longitude: -73.9851 }, // ~120m away
            label: 'Near Train'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        },
        {
          id: 'mediumTrain',
          vehicle: {
            trip: { tripId: '6..N02R', routeId: '6', directionId: 0 },
            position: { latitude: 40.7650, longitude: -73.9851 }, // ~700m away
            label: 'Medium Train'
          },
          feedLines: '6',
          timestamp: { low: Date.now(), high: 0, unsigned: false }
        }
      ];

      // Mock TrainBuilderService for both vehicles
      mockBuildTrainFromVehicleId.mockImplementation((vehicleId: string) => {
        const vehicle = mockVehicles.find(v => v.id === vehicleId);
        if (!vehicle) return Promise.resolve(null);
        
        return Promise.resolve({
          tripId: vehicle.vehicle.trip?.tripId || '',
          routeId: vehicle.vehicle.trip?.routeId || '',
          directionId: 0,
          arrivalTime: new Date().toISOString(),
          vehicleId: vehicle.id,
          currentStop: {
            stopId: 'test-stop',
            stopName: 'Test Stop',
            stopSequence: 1,
            status: 1,
            statusName: 'stopped'
          },
          stops: []
        });
      });

      mockGetVehiclePositions.mockResolvedValue(mockVehicles);

      // Test with default 500m radius - should only find near train
      const defaultResult = await trainFinderService.findNearestTrains(validRequest);
      expect(defaultResult).toHaveLength(1);
      expect(defaultResult[0].label).toBe('Near Train');

      // Test with 1000m radius - should find both trains
      const customRadiusRequest = { ...validRequest, radiusMeters: 1000 };
      const customResult = await trainFinderService.findNearestTrains(customRadiusRequest);
      expect(customResult).toHaveLength(2);
      expect(customResult.some(t => t.label === 'Near Train')).toBe(true);
      expect(customResult.some(t => t.label === 'Medium Train')).toBe(true);
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